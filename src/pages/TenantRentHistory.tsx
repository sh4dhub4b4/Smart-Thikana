import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fmtBDT } from "@/lib/listings";

export default function TenantRentHistory() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRentHistory() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("rent_invoices")
        .select(`
          *,
          listings (title, location)
        `)
        .eq("tenant_id", user.id)
        .order("billing_month", { ascending: false });

      if (!error) setInvoices(data || []);
      setLoading(false);
    }

    fetchRentHistory();
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading rent records...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">My Rent History</h2>
        <Badge variant="outline" className="px-3 py-1">
          {invoices.filter(i => i.status === 'unpaid').length} Pending Payments
        </Badge>
      </div>

      <div className="grid gap-4">
        {invoices.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">No rent invoices generated yet.</p>
          </Card>
        ) : (
          invoices.map((invoice) => (
            <Card key={invoice.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${invoice.status === 'paid' ? 'bg-green-100' : 'bg-amber-100'}`}>
                    {invoice.status === 'paid' ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <Clock className="h-6 w-6 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-lg">
                      {new Date(invoice.billing_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-muted-foreground">{invoice.listings?.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Due by: {new Date(invoice.due_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0">
                  <div className="text-right">
                    <p className="text-xl font-black text-primary">{fmtBDT(invoice.amount_due)}</p>
                    <Badge className={invoice.status === 'paid' ? 'bg-green-500' : 'bg-amber-500'}>
                      {invoice.status.toUpperCase()}
                    </Badge>
                  </div>

                  {invoice.status === 'unpaid' ? (
                    <Button asChild>
                      <Link to={`/payment/${invoice.agreement_id}`}>
                        Pay Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/receipt/${invoice.payment_id}`}>
                        <Receipt className="mr-2 h-4 w-4" /> Receipt
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}