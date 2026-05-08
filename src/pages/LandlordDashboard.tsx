import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Plus, 
  TrendingUp, 
  Wallet, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  FileText 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Listing, fmtBDT } from "@/lib/listings";
import { toast } from "sonner";

interface Stats { 
  listings: number; 
  activeListings: number; 
  earnings: number; 
  pending: number; 
}

interface AgreementRow {
  id: string;
  agreed_price: number;
  status: "pending" | "accepted" | "rejected" | "active";
  tenant_id: string;
  rent_due_day?: number;
  listings: { title: string } | null;
  profiles: { full_name: string } | null;
}

interface PaymentRow {
  id: string;
  receipt_number: string;
  amount: number;
  tenant_id: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

export default function LandlordDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ listings: 0, activeListings: 0, earnings: 0, pending: 0 });
  const [agreements, setAgreements] = useState<AgreementRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  const load = async () => {
    if (!user) return;

    // 1. Fetch core database collections
    const [{ data: ls }, { data: pays }, { data: ags }] = await Promise.all([
      supabase
        .from("listings")
        .select("*")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("*, listings(title)")
        .eq("landlord_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false }),
      supabase
        .from("agreements")
        .select(`
          id, 
          agreed_price, 
          status, 
          tenant_id,
          rent_due_day,
          listings(title)
        `)
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: false })
    ]);

    const listings = (ls as Listing[]) ?? [];
    const rawAgreements = (ags as any[]) ?? [];
    const rawPayments = (pays as any[]) ?? [];

    // 2. Query Profiles for all unique tenants identified
    const tenantIds = Array.from(
      new Set([
        ...rawAgreements.map(a => a.tenant_id),
        ...rawPayments.map(p => p.tenant_id)
      ])
    );

    let profileMap = new Map();
    if (tenantIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", tenantIds);
      
      profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    }

    // 3. Assemble and map relations
    const enrichedAgreements = rawAgreements.map(a => ({
      ...a,
      profiles: profileMap.get(a.tenant_id) || null
    }));

    const enrichedPayments = rawPayments.map(p => ({
      ...p,
      profiles: profileMap.get(p.tenant_id) || null
    }));

    setAgreements(enrichedAgreements);
    setPayments(enrichedPayments);
    
    setStats({
      listings: listings.length,
      activeListings: listings.filter(l => l.is_active).length,
      earnings: rawPayments.reduce((acc: number, p: any) => acc + Number(p.amount), 0),
      pending: rawAgreements.filter((a: any) => a.status === "pending").length,
    });
  };

  useEffect(() => { 
    load(); 
  }, [user]);

  const decideAgreement = async (id: string, status: "accepted" | "rejected") => {
    const { error } = await supabase
      .from("agreements")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Deal ${status === 'accepted' ? 'Approved' : 'Rejected'}`);
      load();
    }
  };

  const cards = [
    { label: "Total Listings", value: stats.listings, icon: Building2, color: "text-primary" },
    { label: "Active Properties", value: stats.activeListings, icon: TrendingUp, color: "text-green-600" },
    { label: "Lifetime Earnings", value: fmtBDT(stats.earnings), icon: Wallet, color: "text-blue-600" },
    { label: "Pending Deals", value: stats.pending, icon: MessageSquare, color: "text-orange-500" },
  ];

  return (
    <div className="container py-8">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Landlord Dashboard</h1>
          <p className="text-muted-foreground">Monitor your properties, deals, and financial history.</p>
        </div>
        <Button asChild>
          <Link to="/landlord/listings/new">
            <Plus className="h-4 w-4 mr-2" /> New Listing
          </Link>
        </Button>
      </div>

      {/* Metrics Cards */}
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

      {/* Primary Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Deal Proposals List */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Rental Deals</h2>
          {agreements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No active rental deals.</p>
          ) : (
            <ul className="divide-y">
              {agreements.map(a => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{a.listings?.title || "Property"}</p>
                    <p className="text-xs text-muted-foreground">
                      From {a.profiles?.full_name || "Tenant"} · {fmtBDT(Number(a.agreed_price))}
                    </p>
                  </div>
                  {a.status === "pending" ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => decideAgreement(a.id, "rejected")}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={() => decideAgreement(a.id, "accepted")}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant={a.status === "accepted" || a.status === "active" ? "default" : "secondary"} className="capitalize">
                      {a.status}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Active Lease Management Panel */}
        <Card className="p-6 border-t-4 border-t-green-500 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" /> Active Lease Management
            </h2>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              Automated billing engine: ON
            </Badge>
          </div>

          {agreements.filter(a => a.status === 'active').length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 rounded-lg border border-dashed flex flex-col items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No active leases currently generating monthly rent.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {agreements.filter(a => a.status === 'active').map(lease => (
                <div key={lease.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50/80 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{lease.listings?.title}</p>
                      <p className="text-[11px] text-muted-foreground">Tenant: {lease.profiles?.full_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-sm">{fmtBDT(Number(lease.agreed_price))}/mo</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                      Due on: {lease.rent_due_day || 5}th
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Payments Ledger Receipts */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Payment Receipts</h2>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No payment records yet.</p>
          ) : (
            <ul className="divide-y">
              {payments.map(p => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-muted-foreground">{p.receipt_number}</p>
                    <p className="text-xs font-medium">{p.profiles?.full_name || "Tenant"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary text-sm">{fmtBDT(p.amount)}</p>
                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" asChild>
                      <Link to={`/receipt/${p.id}`}>Download PDF</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

      </div>
    </div>
  );
}