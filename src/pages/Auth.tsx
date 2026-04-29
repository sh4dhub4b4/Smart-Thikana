/**
 * Auth — combined sign in / sign up with email + Google.
 * Captures the chosen role at signup and writes it into user_roles.
 */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Building2, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth, AppRole } from "@/contexts/AuthContext";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your name").max(100);

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const intendedRole: AppRole = (location.state as any)?.intendedRole ?? "tenant";

  const { user, role, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signup");
  const [selectedRole, setSelectedRole] = useState<AppRole>(intendedRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      // If already has a role, route directly. Otherwise let onboarding handle it.
      if (role) navigate(role === "landlord" ? "/landlord" : "/tenant", { replace: true });
      else navigate("/onboarding", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(fullName);
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, intended_role: selectedRole },
      },
    });
    if (error) { toast.error(error.message); setSubmitting(false); return; }
    if (data.user) {
      // Insert role (the profile is auto-created by trigger; we update name)
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: selectedRole });
      await supabase.from("profiles").update({ full_name: fullName }).eq("id", data.user.id);
      toast.success("Welcome to Bashabari!");
      navigate(selectedRole === "landlord" ? "/landlord" : "/tenant", { replace: true });
    }
    setSubmitting(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try { emailSchema.parse(email); passwordSchema.parse(password); }
    catch (err: any) { toast.error(err.errors?.[0]?.message ?? "Invalid input"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    // Stash the intended role so onboarding can pick it up
    sessionStorage.setItem("bashabari:intendedRole", selectedRole);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-10 bg-gradient-soft">
      <div className="w-full max-w-md animate-fade-in-up">
        <Card className="p-6 sm:p-8 shadow-lg">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold">Welcome to Bashabari</h1>
            <p className="text-sm text-muted-foreground">Sign in or create an account to continue</p>
          </div>

          {/* Role pick */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button type="button" onClick={() => setSelectedRole("tenant")}
              className={`flex items-center gap-2 rounded-md border-2 p-3 text-sm transition-all ${
                selectedRole === "tenant" ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-muted"
              }`}>
              <Home className="h-4 w-4" /> Tenant
            </button>
            <button type="button" onClick={() => setSelectedRole("landlord")}
              className={`flex items-center gap-2 rounded-md border-2 p-3 text-sm transition-all ${
                selectedRole === "landlord" ? "border-accent bg-accent-soft text-accent" : "border-border hover:bg-muted"
              }`}>
              <Building2 className="h-4 w-4" /> Landlord
            </button>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="signin">Sign in</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="email-up">Email</Label>
                  <Input id="email-up" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div>
                  <Label htmlFor="pw-up">Password</Label>
                  <Input id="pw-up" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <Label htmlFor="email-in">Email</Label>
                  <Input id="email-in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="pw-in">Password</Label>
                  <Input id="pw-in" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>
        </Card>
      </div>
    </div>
  );
}
