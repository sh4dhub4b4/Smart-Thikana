/**
 * LandlordDashboard — landing page for landlord users.
 *
 * Aggregates four headline numbers (total / active listings, lifetime
 * earnings, pending agreements) plus the most recent listings and any
 * agreements awaiting Accept/Reject. Accept/Reject is also available
 * inline in the chat, but mirrored here for convenience.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, TrendingUp, Wallet, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Listing, fmtBDT } from "@/lib/listings";
import { toast } from "sonner";

interface Stats { listings: number; activeListings: number; earnings: number; pending: number; }
interface AgreementRow {
  id: string; agreed_price: number; status: "pending" | "accepted" | "rejected";
  listings: { title: string } | null;
  profiles: { full_name: string } | null;
}

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ listings: 0, activeListings: 0, earnings: 0, pending: 0 });
  const [recent, setRecent] = useState<Listing[]>([]);
  const [agreements, setAgreements] = useState<AgreementRow[]>([]);

  const load = async () => {
    if (!user) return;
    const [{ data: ls }, { data: pays }, { data: ags }] = await Promise.all([
      supabase.from("listings").select("*").eq("landlord_id", user.id).order("created_at", { ascending: false }),
      supabase.from("payments").select("amount").eq("landlord_id", user.id).eq("status", "completed"),
      supabase.from("agreements").select("id, agreed_price, status, listings(title), profiles!agreements_tenant_id_fkey(full_name)")
        .eq("landlord_id", user.id).order("created_at", { ascending: false }).limit(8),
    ]);
    const listings = (ls as Listing[]) ?? [];
    setRecent(listings.slice(0, 4));
    setAgreements((ags as any) ?? []);
    setStats({
      listings: listings.length,
      activeListings: listings.filter(l => l.is_active).length,
      earnings: (pays ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0),
      pending: ((ags as any) ?? []).filter((a: AgreementRow) => a.status === "pending").length,
    });
  };

  useEffect(() => { load(); }, [user]);

  const decideAgreement = async (id: string, status: "accepted" | "rejected") => {
    const { error } = await supabase.from("agreements").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Agreement ${status}`); load(); }
  };

  const cards = [
    { label: "Total Listings", value: stats.listings, icon: Building2, color: "text-primary" },
    { label: "Active", value: stats.activeListings, icon: TrendingUp, color: "text-success" },
    { label: "Earnings", value: fmtBDT(stats.earnings), icon: Wallet, color: "text-accent" },
    { label: "Pending Deals", value: stats.pending, icon: MessageSquare, color: "text-warning" },
  ];

  return (
    <div className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Landlord Dashboard</h1>
          <p className="text-muted-foreground">Manage your properties and deals.</p>
        </div>
        <Button asChild><Link to="/landlord/listings/new"><Plus className="h-4 w-4 mr-2" /> New Listing</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map(c => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div className="mt-2 font-display text-2xl font-bold">{c.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent listings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Recent Listings</h2>
            <Link to="/landlord/listings" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No listings yet.</p>
          ) : (
            <ul className="divide-y">
              {recent.map(l => (
                <li key={l.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/listings/${l.id}`} className="font-medium hover:text-primary line-clamp-1">{l.title}</Link>
                    <p className="text-xs text-muted-foreground line-clamp-1">{l.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary text-sm">{fmtBDT(l.price)}</p>
                    <Badge variant={l.is_active ? "default" : "secondary"} className="text-[10px]">
                      {l.is_active ? "active" : "hidden"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Agreements */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Rental Deals</h2>
          {agreements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No deals yet.</p>
          ) : (
            <ul className="divide-y">
              {agreements.map(a => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{a.listings?.title || "Listing"}</p>
                    <p className="text-xs text-muted-foreground">From {a.profiles?.full_name || "Tenant"} · {fmtBDT(Number(a.agreed_price))}</p>
                  </div>
                  {a.status === "pending" ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => decideAgreement(a.id, "rejected")}><XCircle className="h-4 w-4" /></Button>
                      <Button size="sm" onClick={() => decideAgreement(a.id, "accepted")}><CheckCircle2 className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <Badge variant={a.status === "accepted" ? "default" : "secondary"} className="capitalize">{a.status}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
