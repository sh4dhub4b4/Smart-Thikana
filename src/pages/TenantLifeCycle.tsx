import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Home, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function TenantLifeCycle() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLifeCycle() {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from("agreements")
        .select(`
          id, 
          status, 
          created_at,
          listings (
            title, 
            location, 
            thana,
            district
          )
        `)
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase Error:", error.message);
        toast.error("Failed to load rental history");
      } else {
        setHistory(data || []);
      }
      setLoading(false);
    }
    fetchLifeCycle();
  }, [user?.id]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading timeline...</div>;

  return (
    <div className="container max-w-3xl py-12">
      <div className="flex items-center gap-3 mb-8">
        <History className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold font-display">My Tenant Life Cycle</h1>
      </div>

      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-200">
        {history.map((item) => (
          <div key={item.id} className="relative flex items-center gap-8">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full z-10 shrink-0 ${item.status === 'active' ? 'bg-primary' : 'bg-slate-400'}`}>
              {item.status === 'active' ? <Home className="h-5 w-5 text-white" /> : <MapPin className="h-5 w-5 text-white" />}
            </div>
            <Card className={`flex-1 p-5 ${item.status === 'active' ? 'border-primary' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>{item.status}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {item.created_at ? new Date(item.created_at).getFullYear() : 'N/A'} - Present
                </span>
              </div>
              <h3 className="font-bold">{item.listings?.title || "Untitled Listing"}</h3>
              <p className="text-xs text-muted-foreground">
                {[item.listings?.thana, item.listings?.location, item.listings?.district]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}