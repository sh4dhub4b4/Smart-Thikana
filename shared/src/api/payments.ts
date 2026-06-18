import { getSupabaseClient } from "./client";
import type { Payment, RentInvoice } from "../types";

export async function createPayment(
  agreementId: string,
  tenantId: string,
  landlordId: string,
  amount: number,
  taxBreakdown: { tds_amount: number; advance_tax_this_month: number; platform_fee: number; net_to_landlord: number }
): Promise<{ payment: Payment | null; invoice: RentInvoice | null; receiptNumber: string }> {
  const supabase = getSupabaseClient();
  const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const { data: invoice } = await supabase
    .from("rent_invoices")
    .insert({
      agreement_id: agreementId,
      tenant_id: tenantId,
      landlord_id: landlordId,
      amount,
      status: "paid",
      type: "rent",
      due_date: new Date().toISOString(),
    })
    .select()
    .single();

  const { data: payment } = await supabase
    .from("payments")
    .insert({
      agreement_id: agreementId,
      tenant_id: tenantId,
      landlord_id: landlordId,
      amount,
      status: "completed",
      receipt_number: receiptNumber,
    })
    .select()
    .single();

  await supabase.from("ledger_entries").insert([
    { user_id: tenantId, type: "debit", amount, description: `Rent payment ${receiptNumber}` },
    { user_id: landlordId, type: "credit", amount: taxBreakdown.net_to_landlord, description: `Rent received ${receiptNumber}` },
  ]);

  await supabase.from("tax_transactions").insert({
    payment_id: payment?.id,
    tds_amount: taxBreakdown.tds_amount,
    advance_tax: taxBreakdown.advance_tax_this_month,
    platform_fee: taxBreakdown.platform_fee,
  });

  if (invoice) {
    await supabase
      .from("agreements")
      .update({ status: "active" })
      .eq("id", agreementId);
  }

  return {
    payment: payment as Payment | null,
    invoice: invoice as RentInvoice | null,
    receiptNumber,
  };
}

export async function fetchPaymentByAgreement(agreementId: string): Promise<Payment | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("agreement_id", agreementId)
    .maybeSingle();
  return data as Payment | null;
}

export async function fetchReceipt(paymentId: string): Promise<{
  payment: Payment | null;
  invoice: RentInvoice | null;
}> {
  const supabase = getSupabaseClient();
  const { data: payment } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();
  const { data: invoice } = await supabase
    .from("rent_invoices")
    .select("*")
    .eq("payment_id", paymentId)
    .maybeSingle();
  return {
    payment: payment as Payment | null,
    invoice: invoice as RentInvoice | null,
  };
}
