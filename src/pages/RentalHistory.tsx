/**
 * RentalHistory — auto-generated history of every place a tenant has paid
 * rent through Bashabari.
 *
 * Two modes:
 *   • /history          → shows the signed-in tenant's own history.
 *   • /history/:userId  → landlord-only: look up another tenant's history
 *                          by pasting their User ID (from their profile).
 *
 * History is derived server-side from completed `payments` via the
 * `get_tenant_rental_history` RPC (security definer, peer-restricted).
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Receipt, History as HistoryIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fmtBDT } from "@/lib/listings";

interface Row {
  payment_id: string; listing_id: string; listing_title: string | null;
  listing_location: string | null; division: string | null; district: string | null;
  thana: string | null; area_moholla: string | null;
  rent_paid: number; rented_at: string; receipt_number: string;
}

export default function RentalHistory() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const targetId = userId || user?.id;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_tenant_rental_history", { _tenant_id: targetId });
      if (!error) setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, [targetId]);

  return (
    <div className="container max-w-3xl py-8">
      <div className="flex items-center gap-3 mb-6">
        <HistoryIcon className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-bold">
          {userId ? "Tenant Rental History" : "My Rental History"}
        </h1>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Rental records are generated automatically each time a deal is paid through Bashabari.
        {userId && " Visible to landlords for trust verification."}
      </p>

      {loading ? (
        <div className="py-20 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground border-dashed">
          No rental history yet. Records appear here automatically once a rent payment is completed.
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map(r => (
            <Card key={r.payment_id} className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link to={`/listings/${r.listing_id}`} className="font-semibold hover:text-primary">
                  {r.listing_title || "Listing removed"}
                </Link>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[r.area_moholla, r.thana, r.district, r.division].filter(Boolean).join(", ") || r.listing_location}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Receipt className="h-3 w-3" /> 
                  <Link to={`/receipt/${r.payment_id}`} className="hover:text-primary hover:underline">
                    {r.receipt_number}
                  </Link>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display font-bold text-primary">{fmtBDT(Number(r.rent_paid))}</div>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  {new Date(r.rented_at).toLocaleDateString()}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
