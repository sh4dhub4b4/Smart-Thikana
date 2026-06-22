import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Wrench, Settings, MessageSquare, Clock, Loader2 } from "lucide-react";

interface ProviderProfile {
  id: string;
  company_name: string | null;
  phone: string | null;
  hourly_rate: number;
  thana: string | null;
  district: string | null;
  is_verified: boolean;
  is_approved: boolean;
  category_id: string | null;
  service_categories?: { name: string } | null;
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("service_providers")
          .select("*, service_categories(name)")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          toast.error("Failed to load provider profile");
          return;
        }
        if (!data) {
          navigate("/provider/signup", { replace: true });
          return;
        }
        setProfile(data as unknown as ProviderProfile);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const statusBadge = () => {
    if (!profile.is_approved) return <Badge variant="secondary">Pending Approval</Badge>;
    if (!profile.is_verified) return <Badge variant="outline">Pending Verification</Badge>;
    return <Badge className="bg-green-500">Active</Badge>;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Provider Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your services and grow your business</p>
        </div>
        {statusBadge()}
      </div>

      {/* Profile summary */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900 grid place-items-center shrink-0">
            <Wrench className="h-7 w-7 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">{profile.company_name || "Independent Provider"}</h2>
            <p className="text-sm text-muted-foreground">
              {profile.service_categories?.name || "General Services"}
              {profile.thana && profile.district && ` \u2022 ${profile.thana}, ${profile.district}`}
            </p>
            <p className="text-sm font-medium mt-1">Rate: ৳{profile.hourly_rate}/hr</p>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link to="/services">
          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
            <Wrench className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Browse Services</h3>
            <p className="text-sm text-muted-foreground">View available service requests</p>
          </Card>
        </Link>
        <Link to="/messages">
          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
            <MessageSquare className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Messages</h3>
            <p className="text-sm text-muted-foreground">Chat with tenants and landlords</p>
          </Card>
        </Link>
        <Link to="/profile">
          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
            <Settings className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Settings</h3>
            <p className="text-sm text-muted-foreground">Update your profile and preferences</p>
          </Card>
        </Link>
      </div>

      {/* Status info */}
      {!profile.is_approved && (
        <Card className="p-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">Pending Review</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Your provider profile is being reviewed. You will be able to receive service requests once approved.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
