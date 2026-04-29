/**
 * Messages — realtime chat between tenant and landlord per conversation.
 * Tenant can also propose an agreement and (if accepted) proceed to payment.
 */
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Send, Phone, Loader2, MessageSquare, Handshake, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fmtBDT } from "@/lib/listings";
import { toast } from "sonner";

interface ConvRow {
  id: string; listing_id: string; tenant_id: string; landlord_id: string;
  listings: { title: string; price: number; images: string[] } | null;
  tenant: { full_name: string; avatar_url: string | null } | null;
  landlord: { full_name: string; avatar_url: string | null; phone: string | null } | null;
}
interface MsgRow { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; }
interface AgreementRow { id: string; status: "pending" | "accepted" | "rejected"; agreed_price: number; }

export default function Messages() {
  const { user, role } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const activeId = params.get("c");

  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [agreement, setAgreement] = useState<AgreementRow | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find(c => c.id === activeId) || null;
  const other = active ? (role === "tenant" ? active.landlord : active.tenant) : null;

  // Load conversations
  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("conversations")
        .select("id, listing_id, tenant_id, landlord_id, listings(title, price, images), tenant:profiles!conversations_tenant_id_fkey(full_name, avatar_url), landlord:profiles!conversations_landlord_id_fkey(full_name, avatar_url, phone)")
        .order("created_at", { ascending: false });
      setConversations((data as any) ?? []);
    })();
  }, [user]);

  // Load messages + agreement for active conv
  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const [{ data: msgs }, { data: ag }] = await Promise.all([
        supabase.from("messages").select("*").eq("conversation_id", activeId).order("created_at"),
        supabase.from("agreements").select("id, status, agreed_price").eq("conversation_id", activeId).maybeSingle(),
      ]);
      setMessages((msgs as MsgRow[]) ?? []);
      setAgreement((ag as AgreementRow) ?? null);
    })();

    // Realtime
    const channel = supabase.channel(`messages:${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => setMessages(prev => [...prev, payload.new as MsgRow]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeId || !user) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeId, sender_id: user.id, content: draft.trim().slice(0, 2000),
    });
    if (error) toast.error(error.message);
    else setDraft("");
    setSending(false);
  };

  const proposeAgreement = async () => {
    if (!active || !user || role !== "tenant") return;
    const price = active.listings?.price ?? 0;
    const { data, error } = await supabase.from("agreements").insert({
      conversation_id: active.id, listing_id: active.listing_id,
      tenant_id: active.tenant_id, landlord_id: active.landlord_id, agreed_price: price,
    }).select("id, status, agreed_price").single();
    if (error) toast.error(error.message);
    else { setAgreement(data as AgreementRow); toast.success("Agreement proposed"); }
  };

  return (
    <div className="container py-6">
      <h1 className="font-display text-3xl font-bold mb-6">Messages</h1>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-12rem)]">
        {/* Conversation list */}
        <Card className="overflow-hidden flex flex-col">
          <div className="p-3 border-b font-semibold text-sm">Conversations</div>
          <div className="overflow-y-auto flex-1">
            {conversations.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">No conversations yet.</p>
            ) : conversations.map(c => {
              const peer = role === "tenant" ? c.landlord : c.tenant;
              return (
                <button key={c.id} onClick={() => navigate(`/messages?c=${c.id}`)}
                  className={`w-full text-left p-3 flex items-center gap-3 border-b hover:bg-muted ${activeId === c.id ? "bg-primary-soft" : ""}`}>
                  <Avatar className="h-10 w-10"><AvatarImage src={peer?.avatar_url ?? undefined} /><AvatarFallback>{peer?.full_name?.[0] ?? "?"}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{peer?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.listings?.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Chat panel */}
        <Card className="flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 grid place-items-center text-muted-foreground">
              <div className="text-center"><MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" /><p>Select a conversation</p></div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9"><AvatarImage src={other?.avatar_url ?? undefined} /><AvatarFallback>{other?.full_name?.[0] ?? "?"}</AvatarFallback></Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{other?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{active.listings?.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {agreement && <Badge variant={agreement.status === "accepted" ? "default" : agreement.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{agreement.status}</Badge>}
                  <Button size="sm" variant="outline" onClick={() => toast.info(role === "tenant" ? (active.landlord?.phone ? `Call ${active.landlord.phone}` : "No phone") : "Calling tenant...")}>
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Agreement strip */}
              {role === "tenant" && active.listings && (
                <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground truncate">Rent: <strong className="text-foreground">{fmtBDT(active.listings.price)}</strong>/month</span>
                  {!agreement ? (
                    <Button size="sm" variant="outline" onClick={proposeAgreement}><Handshake className="h-3.5 w-3.5 mr-1" /> Propose deal</Button>
                  ) : agreement.status === "accepted" ? (
                    <Button size="sm" onClick={() => navigate(`/payment/${agreement.id}`)}><CreditCard className="h-3.5 w-3.5 mr-1" /> Pay now</Button>
                  ) : null}
                </div>
              )}

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-gradient-soft">
                {messages.length === 0 && <p className="text-center text-xs text-muted-foreground py-10">Say hello!</p>}
                {messages.map(m => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card rounded-bl-sm border"}`}>
                        {m.content}
                        <div className={`text-[10px] mt-0.5 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={send} className="p-3 border-t flex gap-2">
                <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type a message..." maxLength={2000} />
                <Button type="submit" disabled={sending || !draft.trim()}>{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
