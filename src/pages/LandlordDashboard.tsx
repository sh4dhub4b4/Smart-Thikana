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
  FileText,
  CalendarDays,
  BarChart3,
  MapPin,
  Home
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Listing, fmtBDT } from "@/lib/listings";
import { toast } from "sonner";

interface Stats { 
  listings: number; 
  activeListings: number; 
  monthlyEarnings: number;
  yearlyEarnings: number;
  lifetimeEarnings: number; 
  pending: number; 
}

interface AgreementRow {
  id: string;
  agreed_price: number;
  status: "pending" | "accepted" | "rejected" | "active";
  tenant_id: string;
  rent_due_day?: number;
  listings: { 
    title: string;
    location: string;
    property_type: string;
    price: number;
  } | null;
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
  const [stats, setStats] = useState<Stats>({ 
    listings: 0, 
    activeListings: 0, 
    monthlyEarnings: 0,
    yearlyEarnings: 0,
    lifetimeEarnings: 0, 
    pending: 0 
  });
  const [agreements, setAgreements] = useState<AgreementRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  const load = async () => {
    if (!user) return;

    const [{ data: ls }, { data: pays }, { data: ags }] = await Promise.all([
      supabase.from("listings").select("*").eq("landlord_id", user.id).order("created_at", { ascending: false }),
      supabase.from("payments").select("*, listings(title)").eq("landlord_id", user.id).eq("status", "completed").order("created_at", { ascending: false }),
      supabase.from("agreements").select(`id, agreed_price, status, tenant_id, rent_due_day, listings(title, location, property_type, price)`).eq("landlord_id", user.id).order("created_at", { ascending: false })
    ]);

    const listings = (ls as Listing[]) ?? [];
    const rawAgreements = (ags as any[]) ?? [];
    const rawPayments = (pays as any[]) ?? [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthly = rawPayments.reduce((acc, p) => {
      const pDate = new Date(p.created_at);
      return (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) ? acc + Number(p.amount) : acc;
    }, 0);

    const yearly = rawPayments.reduce((acc, p) => {
      const pDate = new Date(p.created_at);
      return (pDate.getFullYear() === currentYear) ? acc + Number(p.amount) : acc;
    }, 0);

    const lifetime = rawPayments.reduce((acc: number, p: any) => acc + Number(p.amount), 0);

    const tenantIds = Array.from(new Set([...rawAgreements.map(a => a.tenant_id), ...rawPayments.map(p => p.tenant_id)]));
    let profileMap = new Map();
    if (tenantIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", tenantIds);
      profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    }

    setAgreements(rawAgreements.map(a => ({ ...a, profiles: profileMap.get(a.tenant_id) || null })));
    setPayments(rawPayments.map(p => ({ ...p, profiles: profileMap.get(p.tenant_id) || null })));
    
    setStats({
      listings: listings.length,
      activeListings: listings.filter(l => l.is_active).length,
      monthlyEarnings: monthly,
      yearlyEarnings: yearly,
      lifetimeEarnings: lifetime,
      pending: rawAgreements.filter((a: any) => a.status === "pending").length,
    });
  };

  useEffect(() => {
    load();
    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agreements', filter: `landlord_id=eq.${user?.id}` }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments', filter: `landlord_id=eq.${user?.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const cards = [
    { label: "Total Listings", value: stats.listings, icon: Home, color: "text-slate-600" },
    { label: "Active Properties", value: stats.activeListings, icon: Building2, color: "text-indigo-600" },
    { label: "Monthly Earnings", value: fmtBDT(stats.monthlyEarnings), icon: CalendarDays, color: "text-emerald-600" },
    { label: "Yearly Earnings", value: fmtBDT(stats.yearlyEarnings), icon: BarChart3, color: "text-blue-600" },
    { label: "Lifetime Earnings", value: fmtBDT(stats.lifetimeEarnings), icon: Wallet, color: "text-slate-600" },
    { label: "Pending Deals", value: stats.pending, icon: MessageSquare, color: "text-orange-500" },
  ];

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Landlord Dashboard</h1>
          <p className="text-muted-foreground">Manage properties and track earnings.</p>
        </div>
        <Button asChild><Link to="/landlord/listings/new"><Plus className="h-4 w-4 mr-2" /> New Listing</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        {cards.map(c => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div className="text-xl font-bold">{c.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rental Deals */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Rental Deals</h2>
          <ul className="divide-y">
            {agreements.map(a => (
              <li key={a.id} className="py-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-sm line-clamp-1">{a.listings?.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.listings?.location}</p>
                </div>
                <Badge variant={a.status === "pending" ? "outline" : "default"}>{a.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        {/* Active Lease Management */}
        <Card className="p-6 border-t-4 border-t-green-500">
          <h2 className="font-display text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" /> Active Leases
          </h2>
          {agreements.filter(a => a.status === 'active').map(lease => (
            <div key={lease.id} className="flex items-center justify-between p-4 border rounded-lg mb-3">
              <div>
                <p className="font-bold text-sm">{lease.listings?.title}</p>
                <p className="text-[11px] text-muted-foreground">{lease.profiles?.full_name}</p>
              </div>
              <p className="font-bold text-primary text-sm">{fmtBDT(Number(lease.agreed_price))}/mo</p>
            </div>
          ))}
        </Card>

        {/* Payment Receipts - RESTORED */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Payment Receipts</h2>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No payment records found.</p>
          ) : (
            <ul className="divide-y">
              {payments.map(p => (
                <li key={p.id} className="py-3 flex items-center justify-between">
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