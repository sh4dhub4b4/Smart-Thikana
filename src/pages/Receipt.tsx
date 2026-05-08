import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, Download, Loader2, Receipt as ReceiptIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fmtBDT } from "@/lib/listings";
import { calculateTaxAutoCut, TaxBreakdown } from "@/lib/tax-engine"; // Ensure this path is correct

export default function Receipt() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [taxDetails, setTaxDetails] = useState<TaxBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceiptData() {
      try {
        if (!id) return;
        setLoading(true);

        // 1. Fetch payment and listing details
        const { data: p, error: pError } = await supabase
          .from("payments")
          .select("*, listings(title, location, property_type)")
          .eq("id", id)
          .maybeSingle();

        if (pError || !p) {
          setError("Payment record not found.");
          return;
        }

        // 2. Fetch profiles for tenant and landlord separately to avoid join failures
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, business_name")
          .in("id", [p.tenant_id, p.landlord_id]);

        const tenant = profiles?.find(pr => pr.id === p.tenant_id);
        const landlord = profiles?.find(pr => pr.id === p.landlord_id);

        // 3. Calculate Tax using the Tax Engine
        // If property is NOT 'apartment', we treat it as commercial for higher tax rates
        const isCommercial = p.listings?.property_type !== 'apartment';
        const breakdown = calculateTaxAutoCut(Number(p.amount), isCommercial);
        
        setTaxDetails(breakdown);
        setData({ ...p, tenant, landlord });
      } catch (err: any) {
        console.error("Receipt error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReceiptData();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Generating your receipt...</p>
    </div>
  );

  if (error || !data || !taxDetails) return (
    <div className="container max-w-md py-20 text-center">
      <h2 className="text-xl font-bold mb-2">Oops!</h2>
      <p className="text-muted-foreground mb-6">{error || "Could not load receipt."}</p>
      <Button asChild><Link to="/dashboard">Return to Dashboard</Link></Button>
    </div>
  );

  return (
    <div className="container max-w-2xl py-10 print:p-0">
      <div className="mb-6 no-print">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-2" /> Dashboard</Link>
        </Button>
      </div>

      <Card className="p-8 border-t-8 border-t-primary shadow-lg">
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Building2 className="h-7 w-7" />
              <span className="font-display font-bold text-2xl tracking-tight">Smart Thikana</span>
            </div>
            <p className="text-sm text-muted-foreground">Digital Rent Receipt • Section 38 Compliant</p>
          </div>
          <div className="text-right">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none mb-2 px-3">
              Payment Successful
            </Badge>
            <p className="text-xs text-muted-foreground font-mono">
              {new Date(data.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Amount Hero Section */}
        <div className="text-center py-8 bg-slate-50 rounded-xl mb-10 border border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Total Paid by Tenant</p>
          <p className="text-5xl font-bold text-slate-900">{fmtBDT(taxDetails.gross_rent)}</p>
          <p className="text-[10px] text-muted-foreground mt-4 font-mono bg-white inline-block px-2 py-1 rounded border">
            TRANS-ID: {data.receipt_number}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-10 px-2">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Tenant (Payer)</h3>
            <p className="font-bold text-slate-800">{data.tenant?.full_name || "Valued Tenant"}</p>
            <p className="text-xs text-slate-500 mt-1">Verified User</p>
          </div>
          <div className="text-right">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Landlord (Recipient)</h3>
            <p className="font-bold text-slate-800">{data.landlord?.business_name || data.landlord?.full_name}</p>
            <p className="text-xs text-slate-500 mt-1">Property Owner</p>
          </div>
        </div>

        {/* Detailed Breakdown Section */}
        <div className="bg-slate-50/50 rounded-lg p-6 mb-8 border border-dashed border-slate-200">
          <h3 className="font-display font-semibold flex items-center gap-2 mb-4 text-slate-800">
            <ReceiptIcon className="h-4 w-4 text-primary" /> Settlement Details
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Gross Monthly Rent</span>
              <span className="font-medium">{fmtBDT(taxDetails.gross_rent)}</span>
            </div>
            
            <div className="flex justify-between text-sm items-center">
              <div className="flex flex-col">
                <span className="text-red-600 font-medium">Income Tax Withheld (TDS)</span>
                <span className="text-[10px] text-slate-400">Automated compliance deduction</span>
              </div>
              <span className="text-red-600 font-medium">− {fmtBDT(taxDetails.tds_amount)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Platform Service Fee (1%)</span>
              <span className="text-slate-500">− {fmtBDT(taxDetails.platform_fee)}</span>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-200 flex justify-between items-end">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Net to Landlord</p>
                <p className="text-sm text-slate-500">Credited to wallet</p>
              </div>
              <span className="text-2xl font-bold text-green-700">{fmtBDT(taxDetails.net_to_landlord)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm border-t pt-8">
          <div className="flex justify-between">
            <span className="text-slate-500">Property</span>
            <span className="font-medium text-slate-900 text-right max-w-[200px]">{data.listings?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Location</span>
            <span className="font-medium text-slate-900 text-right max-w-[200px]">{data.listings?.location}</span>
          </div>
        </div>

        <div className="mt-12 flex gap-4 no-print">
          <Button className="flex-1 shadow-md" onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/LandlordDashboard">Done</Link>
          </Button>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest">
          This is a computer generated document. No signature required.
        </p>
      </Card>
    </div>
  );
}