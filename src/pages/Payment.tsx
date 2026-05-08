//  Payment — simulated checkout for an accepted agreement.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, Lock, Loader2, ArrowLeft, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fmtBDT } from "@/lib/listings";
import { toast } from "sonner";
import { calculateTaxAutoCut } from "@/lib/tax-engine";

export default function Payment() {
  const { agreementId } = useParams<{ agreementId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [agreement, setAgreement] = useState<any>(null);
  const [card, setCard] = useState("");
  const [name, setName] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      if (!agreementId) return;
      const { data, error } = await supabase
        .from("agreements")
        .select("*, listings(title, location)")
        .eq("id", agreementId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching agreement:", error);
        return;
      }
      setAgreement(data);
    })();
  }, [agreementId]);

const pay = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Basic validation
  if (!user || !agreement) return;

  if (agreement.status !== "accepted") {
    toast.error("Agreement must be 'accepted' by the landlord before payment.");
    return;
  }

  if (!name || card.length < 16 || !exp || !cvv) {
    toast.error("Please fill in all payment details correctly.");
    return;
  }

  setPaying(true);

  try {
    const today = new Date().toISOString().split('T')[0]; 

    // 1. CREATE RENT INVOICE 
    const { data: invoice, error: invoiceError } = await supabase
      .from("rent_invoices")
      .insert({
        agreement_id: agreement.id,
        tenant_id: user.id,
        landlord_id: agreement.landlord_id,
        listing_id: agreement.listing_id,
        amount_due: agreement.agreed_price,
        billing_month: today, 
        due_date: today,
        status: 'paid', // Must match invoice_status enum 
        type: 'rent'
      })
      .select("id")
      .single();

    if (invoiceError) throw new Error(`Invoice Failed: ${invoiceError.message}`);

    // 2. CREATE PAYMENT RECORD [cite: 15]
    // Note: invoice_id is required by your schema 
    const { data: payData, error: payError } = await supabase
      .from("payments")
      .insert({
        agreement_id: agreement.id,
        listing_id: agreement.listing_id,
        tenant_id: user.id,
        landlord_id: agreement.landlord_id,
        amount: agreement.agreed_price,
        status: "completed", // Must match payment_status enum [cite: 15]
        invoice_id: invoice.id,
        tax_deducted: true
      })
      .select("id, receipt_number")
      .single();

    if (payError) throw new Error(`Payment Record Failed: ${payError.message}`);

    // 3. BACKGROUND TASKS (Ledger & Tax) [cite: 11, 23]
    // These are wrapped to ensure RLS issues don't stop the tenant's success screen
    try {
      await Promise.all([
        supabase.from('ledger_entries').insert({
          payment_id: payData.id,
          user_id: user.id,
          role: 'tenant',
          entry_type: 'debit',
          debit: agreement.agreed_price,
          description: `Initial rent payment for ${agreement.listings?.title}`
        }),
        supabase.from('tax_transactions').insert({
          payment_id: payData.id,
          landlord_id: agreement.landlord_id,
          gross_rent: calculateTaxAutoCut(agreement.agreed_price).gross_rent,
          tds_amount: calculateTaxAutoCut(agreement.agreed_price).tds_amount,
          advance_tax_amount: calculateTaxAutoCut(agreement.agreed_price).advance_tax_this_month,
          platform_fee: calculateTaxAutoCut(agreement.agreed_price).platform_fee,
          net_to_landlord: calculateTaxAutoCut(agreement.agreed_price).net_to_landlord,
          tax_year: new Date().getFullYear().toString()
        })
      ]);
    } catch (logError) {
      console.warn("Non-critical logging failed:", logError);
    }

    // 4. UPDATE LEASE STATUS [cite: 3]
    await supabase
      .from("agreements")
      .update({ 
        status: "active", 
        updated_at: new Date().toISOString() 
      })
      .eq("id", agreement.id);

    // 5. NOTIFY IN CONVERSATION [cite: 14]
    await supabase.from("messages").insert({
      conversation_id: agreement.conversation_id,
      sender_id: user.id,
      content: `✅ Payment of ${fmtBDT(Number(agreement.agreed_price))} confirmed. Receipt: ${payData.receipt_number}`,
    });

    toast.success("Payment Successful!");
    navigate(`/receipt/${payData.id}`);

  } catch (error: any) {
    console.error("Critical Error:", error);
    toast.error(error.message || "An unexpected error occurred.");
  } finally {
    setPaying(false);
  }
};

  if (!agreement) {
    return (
      <div className="container py-20 grid place-items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Messages
      </Button>

      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Secure Payment</h1>
            <ShieldCheck className="h-12 w-12 text-primary/20" />
          </div>

          <form onSubmit={pay} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Cardholder Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name on card" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card">Card Number</Label>
              <div className="relative">
                <Input id="card" value={card} maxLength={19} onChange={(e) => setCard(e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim())} placeholder="4242 4242 4242 4242" required />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input id="expiry" value={exp} onChange={(e) => setExp(e.target.value)} placeholder="MM/YY" maxLength={5} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input id="cvv" type="password" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" maxLength={4} required />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={paying}>
              {paying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : `Confirm & Pay ${fmtBDT(Number(agreement.agreed_price))}`}
            </Button>
          </form>
        </Card>

        <Card className="p-6 h-fit bg-slate-50">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold">{agreement.listings?.title}</p>
              <p className="text-xs text-muted-foreground">{agreement.listings?.location}</p>
            </div>
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-base font-bold">Total</span>
              <span className="text-xl font-black text-primary">{fmtBDT(Number(agreement.agreed_price))}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}