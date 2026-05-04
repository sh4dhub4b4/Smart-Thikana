/**
 * Profile — edit name, phone, bio, avatar URL, business name.
 * Also surfaces a Call button (tel:) and a link to the KYC page.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Phone, Copy, History } from "lucide-react";

export default function Profile() {
  const { user, profile, role, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAvatarUrl(profile.avatar_url || "");
      setBio(profile.bio || "");
      setBusinessName(profile.business_name || "");
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim().slice(0, 100),
      phone: phone.trim().slice(0, 30) || null,
      avatar_url: avatarUrl.trim() || null,
      bio: bio.trim().slice(0, 500) || null,
      business_name: businessName.trim().slice(0, 100) || null,
    }).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Profile updated"); await refreshProfile(); }
    setSaving(false);
  };

  /** Copy the current user's UUID — useful for sharing for peer feedback. */
  const copyId = async () => {
    if (!user) return;
    await navigator.clipboard.writeText(user.id);
    toast.success("User ID copied — share it for peer reviews");
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="font-display text-3xl font-bold mb-6">Your Profile</h1>
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16"><AvatarImage src={avatarUrl} /><AvatarFallback className="bg-primary text-primary-foreground">{fullName?.[0] ?? "U"}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user?.email}</p>
            <p className="text-xs uppercase tracking-wider text-primary">{role}</p>
          </div>
        </div>

        {/* User ID — visible + copyable. Used for peer feedback & tenant lookup. */}
        <div className="rounded-md border bg-muted/40 p-3">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Your User ID</Label>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 text-xs break-all font-mono">{user?.id}</code>
            <Button type="button" size="sm" variant="outline" onClick={copyId}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Share this ID with {role === "tenant" ? "landlords so they can review you and look up your rental history" : "tenants so they can review you"}.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/kyc"><ShieldCheck className="h-4 w-4 mr-2" /> KYC verification</Link>
          </Button>
          {role === "tenant" ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/history"><History className="h-4 w-4 mr-2" /> My rental history</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/tenant-lookup"><History className="h-4 w-4 mr-2" /> Look up tenant</Link>
            </Button>
          )}
        </div>

        <div><Label>Full name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880..." /></div>
        <div><Label>Avatar URL</Label><Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." /></div>
        {role === "landlord" && (
          <div><Label>Business name (optional)</Label><Input value={businessName} onChange={e => setBusinessName(e.target.value)} /></div>
        )}
        <div><Label>Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder={role === "tenant" ? "Tell landlords what you're looking for..." : "Introduce yourself..."} /></div>
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save changes</Button>
      </Card>
    </div>
  );
}
