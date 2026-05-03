/**
 * Feedback — peer-only review board.
 *
 * Visibility rules (enforced by RLS):
 *   • Landlords see feedback authored BY landlords (i.e. about tenants).
 *   • Tenants see feedback authored BY tenants (i.e. about landlords).
 *   • Authors can also see their own past feedback.
 *   • The subject of a review can NEVER see their own ratings.
 *
 * Users can write a new review by entering the subject's email — we look up
 * their profile id, then insert with author_role = current role.
 */
import { useEffect, useState } from "react";
import { Loader2, Star, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FbRow {
  id: string; author_id: string; subject_id: string;
  author_role: "tenant" | "landlord"; rating: number; comment: string | null; created_at: string;
}
interface ProfileLite { id: string; full_name: string; avatar_url: string | null }

export default function Feedback() {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<FbRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);

  // New-review form
  const [subjectId, setSubjectId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load all feedback the current user is allowed to see.
  // RLS already filters server-side; we don't need any extra .eq() here.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("feedback").select("*").order("created_at", { ascending: false });
      const fb = (data as FbRow[]) ?? [];
      setRows(fb);
      // Hydrate profile avatars/names for both authors and subjects.
      const ids = [...new Set(fb.flatMap(r => [r.author_id, r.subject_id]))];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids);
        const map: Record<string, ProfileLite> = {};
        (profs ?? []).forEach((p: any) => { map[p.id] = p as ProfileLite; });
        setProfiles(map);
      }
      setLoading(false);
    })();
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !role) return;
    if (!subjectId.trim()) { toast.error("Enter the user ID of the person you're reviewing"); return; }
    if (subjectId.trim() === user.id) { toast.error("You can't review yourself"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("feedback").insert({
      author_id: user.id,
      subject_id: subjectId.trim(),
      author_role: role,
      rating,
      comment: comment.trim().slice(0, 500) || null,
    }).select().single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setRows(prev => [data as FbRow, ...prev]);
    setSubjectId(""); setRating(5); setComment("");
    toast.success("Feedback posted");
  };

  if (!role) return <div className="container py-12 text-center text-muted-foreground">Choose your role first.</div>;
  if (loading) return <div className="container py-20 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const targetRole = role === "tenant" ? "landlord" : "tenant";

  return (
    <div className="container max-w-3xl py-8 space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Peer Feedback</h1>
        <p className="text-muted-foreground text-sm mt-1">
          As a {role}, you can rate {targetRole}s. Reviews here are visible only to other {role}s — the {targetRole} you review will never see them.
        </p>
      </header>

      {/* New review */}
      <Card className="p-6">
        <h2 className="font-display font-semibold mb-4">Write a review</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>{targetRole === "landlord" ? "Landlord" : "Tenant"} user ID</Label>
            <Input value={subjectId} onChange={e => setSubjectId(e.target.value)}
              placeholder="Paste user ID from their profile" />
            <p className="text-xs text-muted-foreground mt-1">
              Tip: ask them to share their profile ID, or copy it from a past message thread URL.
            </p>
          </div>
          <div>
            <Label>Rating</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star className={`h-7 w-7 transition ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Comment (optional, max 500 chars)</Label>
            <Textarea rows={3} value={comment} onChange={e => setComment(e.target.value.slice(0, 500))}
              placeholder={`What was your experience with this ${targetRole}?`} />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Post review
          </Button>
        </form>
      </Card>

      {/* Feed */}
      <div className="space-y-3">
        <h2 className="font-display font-semibold">Recent reviews from fellow {role}s</h2>
        {rows.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">No reviews yet.</Card>
        ) : rows.map(r => {
          const author = profiles[r.author_id];
          const subject = profiles[r.subject_id];
          const mine = r.author_id === user?.id;
          return (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={author?.avatar_url ?? undefined} />
                  <AvatarFallback>{author?.full_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{author?.full_name ?? "Anonymous"}</span>
                    {mine && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                    <span className="text-xs text-muted-foreground">
                      reviewed {subject?.full_name ?? "a user"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-sm mt-2 leading-relaxed">{r.comment}</p>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
