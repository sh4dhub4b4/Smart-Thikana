/**
 * Receipt — branded digital receipt, printable.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Building2, CheckCircle2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { fmtBDT } from "@/lib/listings";

export default function Receipt() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: p } = await supabase.from("payments")
        .select("*, listings(title, location), tenant:profiles!payments_tenant_id_fkey(full_name), landlord:profiles!payments_landlord_id_fkey(full_name, business_name)")
        .eq("id", id).maybeSingle();
      setData(p);
    })();
  }, [id]);

  if (!data) return <div className="container py-20 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link to="/tenant" className="text-sm text-primary hover:underline">← Back to listings</Link>
        <Button onClick={() => window.print()} variant="outline"><Download className="h-4 w-4 mr-2" /> Save / Print</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="gov-stripe h-1.5" />
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-gradient-hero shadow-brand">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-display font-bold text-primary">Bashabari</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Official Receipt</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-success text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" /> Paid
            </div>
          </div>

          <div className="text-center my-6 py-6 border-y">
            <p className="text-sm text-muted-foreground">Amount paid</p>
            <p className="font-display text-4xl font-bold text-primary mt-1">{fmtBDT(Number(data.amount))}</p>
            <p className="text-xs text-muted-foreground mt-2">Receipt #{data.receipt_number}</p>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Property</dt><dd className="font-medium text-right">{data.listings?.title}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Location</dt><dd className="font-medium text-right">{data.listings?.location}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Paid by</dt><dd className="font-medium text-right">{data.tenant?.full_name}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Paid to</dt><dd className="font-medium text-right">{data.landlord?.business_name || data.landlord?.full_name}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Date</dt><dd className="font-medium text-right">{new Date(data.created_at).toLocaleString()}</dd></div>
          </dl>

          <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
            <p>Thank you for using Bashabari.</p>
            <p>This is a digital receipt; both parties have a copy in their dashboard.</p>
          </div>
        </div>
        <div className="gov-stripe h-1.5" />
      </Card>
    </div>
  );
}
