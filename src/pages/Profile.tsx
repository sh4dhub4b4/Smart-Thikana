/**
 * Profile — edit name, phone, bio, avatar URL, business name.
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="font-display text-3xl font-bold mb-6">Your Profile</h1>
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16"><AvatarImage src={avatarUrl} /><AvatarFallback className="bg-primary text-primary-foreground">{fullName?.[0] ?? "U"}</AvatarFallback></Avatar>
          <div>
            <p className="font-semibold">{user?.email}</p>
            <p className="text-xs uppercase tracking-wider text-primary">{role}</p>
          </div>
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
