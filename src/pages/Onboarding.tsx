/**
 * Onboarding — runs after Google sign-in if the user doesn't yet have a role.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Onboarding() {
  const { user, role, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<AppRole>(
    (sessionStorage.getItem("bashabari:intendedRole") as AppRole) || "tenant"
  );

  useEffect(() => {
    if (role) navigate(role === "landlord" ? "/landlord" : "/tenant", { replace: true });
  }, [role, navigate]);

  const choose = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: picked });
    if (error) { toast.error(error.message); setSaving(false); return; }
    sessionStorage.removeItem("bashabari:intendedRole");
    await refreshProfile();
    navigate(picked === "landlord" ? "/landlord" : "/tenant", { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] grid place-items-center px-4 py-10 bg-gradient-soft">
      <Card className="w-full max-w-lg p-8 animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold text-center">Choose your role</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">You can change this later in settings.</p>
        <div className="grid grid-cols-2 gap-3 my-6">
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
        </div>
        <Button className="w-full" onClick={choose} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continue
        </Button>
      </Card>
    </div>
  );
}
