// src/lib/tax-engine.ts

export interface TaxBreakdown {
  gross_rent: number;
  tds_amount: number;
  advance_tax_this_month: number;
  platform_fee: number;
  net_to_landlord: number;
}

/**
 * Implements Bangladesh Income Tax Act 2023 Rules for automated tax deduction.
 */
export const calculateTaxAutoCut = (
  grossRent: number, 
  isCommercial: boolean = false, 
  isOrgTenant: boolean = false
): TaxBreakdown => {
  const TAX_FREE_LIMIT = 350000;
  const MIN_ADVANCE_TAX_RATE = 0.05; // 5% Non-Zero Tax Rule [cite: 35]
  const PLATFORM_FEE_RATE = 0.01;    // 1% [cite: 38]
  const TDS_RATE = 0.10;             // 10% for organizations [cite: 33]

  // 1. Statutory Deduction (Section 38)
  const statRate = isCommercial ? 0.30 : 0.25;
  const netMonthly = grossRent * (1 - statRate);

  // 2. Annual Projection (Current Month x 12) [cite: 34, 36]
  const projectedAnnualNet = netMonthly * 12;

  // 3. Progressive Slabs [cite: 27]
  let annualTax = 0;
  let remaining = projectedAnnualNet;
  const slabs = [
    { limit: 350000, rate: 0.00 },
    { limit: 100000, rate: 0.05 },
    { limit: 300000, rate: 0.10 },
    { limit: 400000, rate: 0.15 },
    { limit: 500000, rate: 0.20 }
  ];

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, slab.limit);
    annualTax += taxable * slab.rate;
    remaining -= slab.limit;
  }
  if (remaining > 0) annualTax += remaining * 0.25;

  // 4. Applying Non-Zero Tax Policy [cite: 35]
  if (annualTax === 0 && projectedAnnualNet > 0) {
    annualTax = projectedAnnualNet * MIN_ADVANCE_TAX_RATE;
  }

  const advanceTaxMonthly = annualTax / 12;
  const tdsAmount = isOrgTenant ? (grossRent * TDS_RATE) : 0;
  const platformFee = grossRent * PLATFORM_FEE_RATE;

  return {
    gross_rent: grossRent,
    tds_amount: Number(tdsAmount.toFixed(2)),
    advance_tax_this_month: Number(advanceTaxMonthly.toFixed(2)),
    platform_fee: Number(platformFee.toFixed(2)),
    net_to_landlord: Number(Math.max(0, grossRent - (tdsAmount + advanceTaxMonthly + platformFee)).toFixed(2))
  };
};