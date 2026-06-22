/**
 * Onboarding — runs after sign-in if the user doesn't yet have a row in
 * `user_roles` (typical for fresh Google sign-ins, since email signup
 * already records the chosen role).
 *
 * The intended role can be pre-selected via sessionStorage (set by the
 * Auth screen before the OAuth redirect) — otherwise we default to tenant.
 * `ProtectedRoute` redirects role-less users here, so this page is the
 * single funnel for choosing tenant vs landlord.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Home, Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Onboarding() {
  const { user, role, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<AppRole>(() => {
    const stored = localStorage.getItem("smartthikana:intendedRole");
    return stored === "tenant" || stored === "landlord" || stored === "service_provider" ? stored : "tenant";
  });

  useEffect(() => {
    if (role) navigate(role === "landlord" ? "/landlord" : role === "service_provider" ? "/provider" : "/tenant", { replace: true });
  }, [role, navigate]);

  const choose = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: picked });
      if (error && error.code !== '23505') {
        toast.error(error.message); return;
      }
      localStorage.removeItem("smartthikana:intendedRole");
      await refreshProfile();
      navigate(picked === "landlord" ? "/landlord" : picked === "service_provider" ? "/provider" : "/tenant", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] grid place-items-center px-4 py-10 bg-gradient-soft">
      <Card className="w-full max-w-lg p-8 animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold text-center">Choose your role</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">You can change this later in settings.</p>
        <div className="grid grid-cols-3 gap-3 my-6">
          <button onClick={() => setPicked("tenant")}
            className={`p-5 rounded-md border-2 text-left transition-all ${picked === "tenant" ? "border-primary bg-primary-soft" : "border-border"}`}>
            <Home className="h-6 w-6 text-primary mb-2" />
            <div className="font-semibold">Tenant</div>
            <div className="text-xs text-muted-foreground">Find a place to rent</div>
          </button>
          <button onClick={() => setPicked("landlord")}
            className={`p-5 rounded-md border-2 text-left transition-all ${picked === "landlord" ? "border-accent bg-accent-soft" : "border-border"}`}>
            <Building2 className="h-6 w-6 text-accent mb-2" />
            <div className="font-semibold">Landlord</div>
            <div className="text-xs text-muted-foreground">List your properties</div>
          </button>
          <button onClick={() => setPicked("service_provider")}
            className={`p-5 rounded-md border-2 text-left transition-all ${picked === "service_provider" ? "border-blue-600 bg-blue-50 text-blue-600" : "border-border hover:bg-muted"}`}>
            <Wrench className="h-6 w-6 text-blue-500 mb-2" />
            <div className="font-semibold">Provider</div>
            <div className="text-xs text-muted-foreground">Offer your services</div>
          </button>
        </div>
        <Button className="w-full" onClick={choose} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continue
        </Button>
      </Card>
    </div>
  );
}
