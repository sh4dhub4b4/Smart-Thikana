/**
 * KYC — Know Your Customer page.
 *
 * Available to BOTH landlords and tenants. Users upload:
 *   - NID front + back
 *   - A selfie
 *   - NID number (text)
 *
 * Files go into the private `kyc-docs` bucket under a folder named with the
 * user's UUID (RLS enforces that they can only access their own folder).
 * The `kyc` table stores the storage paths + status.
 *
 * Status flow: pending → verified | rejected (set by an admin out of band).
 */
import { useEffect, useState } from "react";
import { Loader2, Upload, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type KycStatus = "pending" | "verified" | "rejected";
interface KycRow {
  id: string; user_id: string; nid_number: string | null;
  nid_front_url: string | null; nid_back_url: string | null; selfie_url: string | null;
  status: KycStatus; notes: string | null;
}

const STATUS_META: Record<KycStatus, { label: string; icon: typeof ShieldCheck; variant: "default" | "secondary" | "destructive" }> = {
  pending:  { label: "Pending review", icon: ShieldAlert, variant: "secondary" },
  verified: { label: "Verified",       icon: ShieldCheck, variant: "default"   },
  rejected: { label: "Rejected",       icon: ShieldX,     variant: "destructive" },
};

export default function Kyc() {
  const { user } = useAuth();
  const [row, setRow] = useState<KycRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [nidNumber, setNidNumber] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Local "just-uploaded" paths (so the UI shows them before save)
  const [paths, setPaths] = useState({ nid_front_url: "", nid_back_url: "", selfie_url: "" });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from("kyc").select("*").eq("user_id", user.id).maybeSingle();
        if (cancelled || error) return;
        if (data) {
          setRow(data as KycRow);
          setNidNumber(data.nid_number ?? "");
          setPaths({
            nid_front_url: data.nid_front_url ?? "",
            nid_back_url:  data.nid_back_url ?? "",
            selfie_url:    data.selfie_url ?? "",
          });
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load KYC:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  /** Upload one file into `${user.id}/<field>-<timestamp>.ext` and store the path. */
  const handleUpload = async (field: keyof typeof paths, file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max file size is 5 MB"); return; }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) { toast.error("Only JPEG, PNG, WebP, and GIF images are allowed"); return; }
    setUploading(field);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kyc-docs").upload(path, file, { upsert: true });
    setUploading(null);
    if (error) { toast.error(error.message); return; }
    const { data: urlData } = supabase.storage.from("kyc-docs").getPublicUrl(path);
    const publicUrl = urlData?.publicUrl ?? path;
    setPaths(prev => ({ ...prev, [field]: publicUrl }));
    toast.success("Uploaded");
  };

  /** Persist the form (insert if first time, otherwise update). Resets status to pending on edit. */
  const save = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      nid_number: nidNumber.trim().slice(0, 30) || null,
      nid_front_url: paths.nid_front_url || null,
      nid_back_url: paths.nid_back_url || null,
      selfie_url: paths.selfie_url || null,
      status: "pending" as KycStatus,
    };
    const { data, error } = row
      ? await supabase.from("kyc").update(payload).eq("user_id", user.id).select().single()
      : await supabase.from("kyc").insert(payload).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setRow(data as KycRow);
    toast.success("KYC submitted for review");
  };

  if (loading) return <div className="container py-20 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const StatusIcon = STATUS_META[row?.status ?? "pending"].icon;

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">Identity Verification</h1>
        {row && (
          <Badge variant={STATUS_META[row.status].variant} className="flex items-center gap-1">
            <StatusIcon className="h-3.5 w-3.5" /> {STATUS_META[row.status].label}
          </Badge>
        )}
      </div>

      <Card className="p-6 space-y-5">
        <p className="text-sm text-muted-foreground">
          Verifying your identity builds trust with {row ? "the other party" : "tenants and landlords"}.
          All documents are stored privately and only visible to you and our review team.
        </p>

        <div>
          <Label>NID Number</Label>
          <Input value={nidNumber} onChange={e => setNidNumber(e.target.value)} placeholder="10 / 13 / 17 digits" maxLength={30} />
        </div>

        <UploadField label="NID — Front side" field="nid_front_url"
          value={paths.nid_front_url} uploading={uploading === "nid_front_url"}
          onPick={(f) => handleUpload("nid_front_url", f)} />
        <UploadField label="NID — Back side" field="nid_back_url"
          value={paths.nid_back_url} uploading={uploading === "nid_back_url"}
          onPick={(f) => handleUpload("nid_back_url", f)} />
        <UploadField label="Selfie holding NID" field="selfie_url"
          value={paths.selfie_url} uploading={uploading === "selfie_url"}
          onPick={(f) => handleUpload("selfie_url", f)} />

        {row?.notes && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <strong className="block mb-1">Reviewer notes:</strong>
            <span className="text-muted-foreground">{row.notes}</span>
          </div>
        )}

        <Button onClick={save} disabled={saving} className="w-full">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {row ? "Resubmit for review" : "Submit for review"}
        </Button>
      </Card>
    </div>
  );
}

/** Small reusable file-input row used 3× above. */
function UploadField({ label, field, value, uploading, onPick }: {
  label: string; field: string; value: string; uploading: boolean;
  onPick: (file: File) => void;
}) {
  return (
    <div>
      <Label htmlFor={field}>{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <Input id={field} type="file" accept="image/*"
          onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
          disabled={uploading} />
        {uploading ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
          : value ? <Upload className="h-4 w-4 text-emerald-600" /> : null}
      </div>
      {value && <p className="text-xs text-muted-foreground mt-1 truncate">Saved: {value.split("/").pop()}</p>}
    </div>
  );
}
