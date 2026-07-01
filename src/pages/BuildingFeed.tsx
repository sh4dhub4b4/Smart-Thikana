import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Building2, Phone, Megaphone, Loader2, Send, Pin, Users } from "lucide-react";

interface Building {
  id: string;
  name: string;
  building_type: string;
  division: string | null;
  district: string | null;
  thana: string | null;
  total_floors: number | null;
  has_security: boolean | null;
  has_parking: boolean | null;
}

interface Post {
  id: string;
  title: string | null;
  content: string;
  post_type: string;
  is_pinned: boolean | null;
  created_at: string;
  author_name?: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
}

export default function BuildingFeed() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [building, setBuilding] = useState<Building | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        let buildingId: string | null = null;

        if (role === "landlord") {
          const { data } = await supabase
            .from("buildings")
            .select("id")
            .eq("owner_id", user.id)
            .limit(1)
            .maybeSingle();
          buildingId = data?.id ?? null;
        } else if (role === "tenant") {
          const { data: listing } = await supabase
            .from("listings")
            .select("building_id")
            .eq("landlord_id", user.id)
            .not("building_id", "is", null)
            .limit(1)
            .maybeSingle();
          buildingId = listing?.building_id ?? null;
        }

        if (!buildingId) {
          if (!cancelled) setLoading(false);
          return;
        }

        const [{ data: b }, { data: p }, { data: e }] = await Promise.all([
          supabase.from("buildings").select("*").eq("id", buildingId).single(),
          supabase.from("community_posts").select("*").eq("building_id", buildingId).order("created_at", { ascending: false }).limit(30),
          supabase.from("emergency_contacts").select("*").eq("building_id", buildingId),
        ]);

        if (cancelled) return;
        if (b) setBuilding(b as Building);

        if (p) {
          const authorIds = [...new Set(p.map((post: any) => post.author_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", authorIds);
          const nameMap = new Map((profiles || []).map((prof: any) => [prof.id, prof.full_name]));
          setPosts((p as Post[]).map(post => ({ ...post, author_name: nameMap.get(post.author_id) || "Unknown" })));
        }

        if (e) setEmergencyContacts(e as EmergencyContact[]);
      } catch (err) {
        if (!cancelled) console.error("Failed to load building:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, role]);

  const handlePost = async () => {
    if (!newContent.trim() || !building || !user) return;
    setSending(true);
    const { error } = await supabase.from("community_posts").insert({
      building_id: building.id,
      author_id: user.id,
      title: newTitle.trim() || null,
      content: newContent.trim(),
      post_type: "notice",
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setNewTitle("");
    setNewContent("");
    toast.success("Notice posted");
    // Refresh posts
    const { data: p } = await supabase
      .from("community_posts")
      .select("*")
      .eq("building_id", building.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (p) setPosts(p as Post[]);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!building) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-semibold mb-2">No Building Assigned</h2>
            <p className="text-sm mb-4">
              {role === "landlord"
                ? "Register your building to enable community features."
                : "You are not linked to any building yet."}
            </p>
            {role === "landlord" && (
              <Button onClick={() => navigate("/buildings/new")}>Register Building</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {building.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {building.thana && `${building.thana}, `}{building.district} · {building.building_type}
          </p>
        </div>
        {role === "landlord" && (
          <Button variant="outline" onClick={() => navigate(`/buildings/${building.id}/manage`)}>
            Manage Building
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Main feed */}
        <div className="space-y-4">
          {/* New post form */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <Input
                placeholder="Notice title (optional)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Textarea
                placeholder="Share an update with your building..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button onClick={handlePost} disabled={sending || !newContent.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts feed */}
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notices yet. Be the first to post!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    {post.is_pinned && <Pin className="h-4 w-4 text-primary shrink-0 mt-1" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {post.title && <h3 className="font-semibold text-sm">{post.title}</h3>}
                        <Badge variant="outline" className="text-[10px] uppercase">{post.post_type}</Badge>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{post.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {post.author_name} · {new Date(post.created_at).toLocaleDateString("en-BD", { dateStyle: "medium" })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Emergency contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-red-500" /> Emergency Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {emergencyContacts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No contacts added.</p>
              ) : (
                emergencyContacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.role}</p>
                    </div>
                    <a href={`tel:${c.phone}`} className="text-primary font-medium hover:underline text-xs">
                      {c.phone}
                    </a>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Building info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" /> Building Info
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1 text-muted-foreground">
              <p>Type: {building.building_type.replace(/_/g, " ")}</p>
              {building.total_floors && <p>Floors: {building.total_floors}</p>}
              {building.has_security && <p>Security: Yes</p>}
              {building.has_parking && <p>Parking: Yes</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
