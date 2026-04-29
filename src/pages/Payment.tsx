/**
 * Payment — simulated checkout. On submit creates a payment row and redirects to receipt.
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, Lock, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fmtBDT } from "@/lib/listings";
import { toast } from "sonner";

export default function Payment() {
  const { agreementId } = useParams<{ agreementId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agreement, setAgreement] = useState<any>(null);
  const [card, setCard] = useState(""); const [name, setName] = useState(""); const [exp, setExp] = useState(""); const [cvv, setCvv] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      if (!agreementId) return;
      const { data } = await supabase.from("agreements").select("*, listings(title, location)").eq("id", agreementId).maybeSingle();
      setAgreement(data);
    })();
  }, [agreementId]);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !agreement) return;
    if (agreement.status !== "accepted") { toast.error("Agreement not accepted yet"); return; }
    if (card.replace(/\s/g, "").length < 12) { toast.error("Enter a valid card number"); return; }
    setPaying(true);
    await new Promise(r => setTimeout(r, 1200)); // simulate processing
    const { data, error } = await supabase.from("payments").insert({
      agreement_id: agreement.id, listing_id: agreement.listing_id,
      tenant_id: agreement.tenant_id, landlord_id: agreement.landlord_id,
      amount: agreement.agreed_price, status: "completed",
    }).select("id").single();
    setPaying(false);
    if (error) { toast.error(error.message); return; }
    navigate(`/receipt/${data.id}`);
  };

  if (!agreement) return <div className="container py-20 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container max-w-2xl py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
      <div className="grid md:grid-cols-[1fr_240px] gap-4">
        <Card className="p-6">
          <h1 className="font-display text-2xl font-bold mb-1">Secure Payment</h1>
          <p className="text-sm text-muted-foreground mb-6 flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Encrypted simulation — no real money.</p>
          <form onSubmit={pay} className="space-y-4">
            <div><Label>Cardholder name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name on card" /></div>
            <div>
              <Label>Card number</Label>
              <div className="relative">
                <Input value={card} maxLength={19}
                  onChange={e => setCard(e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim())}
                  placeholder="4242 4242 4242 4242" />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Expiry</Label><Input value={exp} onChange={e => setExp(e.target.value)} placeholder="MM/YY" maxLength={5} /></div>
              <div><Label>CVV</Label><Input type="password" value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123" maxLength={4} /></div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={paying}>
              {paying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Pay {fmtBDT(Number(agreement.agreed_price))}
            </Button>
          </form>
        </Card>

        <Card className="p-5 h-fit">
          <h3 className="font-display font-semibold mb-3">Order summary</h3>
          <p className="text-sm font-medium">{agreement.listings?.title}</p>
          <p className="text-xs text-muted-foreground mb-4">{agreement.listings?.location}</p>
          <div className="border-t pt-3 flex justify-between text-sm"><span>First month rent</span><strong>{fmtBDT(Number(agreement.agreed_price))}</strong></div>
          <div className="mt-1 flex justify-between text-base font-bold text-primary"><span>Total</span><span>{fmtBDT(Number(agreement.agreed_price))}</span></div>
        </Card>
      </div>
    </div>
  );
}
