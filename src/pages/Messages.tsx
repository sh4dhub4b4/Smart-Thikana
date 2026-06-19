/**
 * Messages — realtime chat between tenant and landlord per conversation.
 * Now includes full tenant profile access for landlords.
 */
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Send, Phone, Loader2, MessageSquare, Handshake, CreditCard, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { fmtBDT } from "@/lib/listings";
import { toast } from "sonner";

// --- REQUIRED INTERFACES (Fixes errors 2304) ---
interface PeerInfo { id: string; full_name: string; avatar_url: string | null; phone: string | null }
interface ListingInfo { id: string; title: string; price: number; images: string[] }
interface ConvRow {
  id: string; listing_id: string; tenant_id: string; landlord_id: string; created_at: string;
  listing: ListingInfo | null;
  tenant: PeerInfo | null;
  landlord: PeerInfo | null;
}
interface MsgRow { id: string; conversation_id: string; sender_id: string; content: string; created_at: string }
interface AgreementRow {
  id: string; status: "pending" | "accepted" | "rejected"; agreed_price: number;
  payments?: { id: string }[];
}

export default function Messages() {
  const { user, role } = useAuth();
  const { clearUnread } = useMessageNotifications();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const activeId = params.get("c");

  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [agreement, setAgreement] = useState<AgreementRow | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find(c => c.id === activeId) || null;
  const other = active ? (role === "tenant" ? active.landlord : active.tenant) : null;

  useEffect(() => { clearUnread(); }, [clearUnread, activeId]);

  // Load Conversations
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingConvs(true);
    (async () => {
      try {
        const { data: convs, error } = await supabase
          .from("conversations")
          .select("id, listing_id, tenant_id, landlord_id, created_at")
          .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (error) { toast.error(error.message); setLoadingConvs(false); return; }
        const rows = (convs ?? []) as any[];
        if (rows.length === 0) { setConversations([]); setLoadingConvs(false); return; }

        const listingIds = [...new Set(rows.map(r => r.listing_id))];
        const profileIds = [...new Set(rows.flatMap(r => [r.tenant_id, r.landlord_id]))];

        const [{ data: listings }, { data: profiles }] = await Promise.all([
          supabase.from("listings").select("id, title, price, images").in("id", listingIds),
          supabase.from("profiles").select("id, full_name, avatar_url, phone").in("id", profileIds),
        ]);

        if (cancelled) return;
        const listingMap = new Map((listings ?? []).map((l: any) => [l.id, l as ListingInfo]));
        const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p as PeerInfo]));

        setConversations(rows.map(r => ({
          ...r,
          listing: listingMap.get(r.listing_id) ?? null,
          tenant: profileMap.get(r.tenant_id) ?? null,
          landlord: profileMap.get(r.landlord_id) ?? null,
        })));
      } catch (err) {
        if (!cancelled) console.error("Failed to load conversations:", err);
      } finally {
        if (!cancelled) setLoadingConvs(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Load Messages & Agreement
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ data: msgs }, { data: ag }] = await Promise.all([
          supabase.from("messages").select("*").eq("conversation_id", activeId).order("created_at"),
          supabase.from("agreements").select("id, status, agreed_price, payments(id)").eq("conversation_id", activeId).maybeSingle(),
        ]);
        if (!cancelled) {
          setMessages((msgs as MsgRow[]) ?? []);
          setAgreement((ag as AgreementRow) ?? null);
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load messages:", err);
      }
    })();

    const channel = supabase.channel(`messages:${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => setMessages(prev => [...prev, payload.new as MsgRow]))
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Actions
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeId || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: activeId, sender_id: user.id, content: draft.trim().slice(0, 2000),
      });
      if (error) toast.error(error.message); else setDraft("");
    } finally {
      setSending(false);
    }
  };

  // Fixed callPeer function (Fixes error 2304)
  const callPeer = () => {
    const phone = role === "tenant" ? active?.landlord?.phone : active?.tenant?.phone;
    if (!phone) { toast.info("Phone number not provided"); return; }
    window.location.href = `tel:${phone}`;
  };

  const respondToAgreement = async (newStatus: "accepted" | "rejected") => {
    if (!agreement || role !== "landlord") return;
    const { data, error } = await supabase.from("agreements")
      .update({ status: newStatus }).eq("id", agreement.id)
      .select("id, status, agreed_price").single();
    if (error) { toast.error(error.message); return; }
    setAgreement(data as AgreementRow);
    toast.success(newStatus === "accepted" ? "Deal accepted" : "Deal rejected");
  };

  const proposeAgreement = async () => {
    if (!active || !user || role !== "tenant" || !active.listing) return;
    const { data, error } = await supabase.from("agreements").insert({
      conversation_id: active.id, listing_id: active.listing_id,
      tenant_id: active.tenant_id, landlord_id: active.landlord_id,
      agreed_price: active.listing.price,
    }).select("id, status, agreed_price").single();
    if (error) toast.error(error.message);
    else { setAgreement(data as AgreementRow); toast.success("Agreement proposed"); }
  };

  return (
    <div className="container py-6">
      <h1 className="font-display text-3xl font-bold mb-6">Messages</h1>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-12rem)]">
        <Card className="overflow-hidden flex flex-col">
          <div className="p-3 border-b font-semibold text-sm">Conversations</div>
          <div className="overflow-y-auto flex-1">
            {loadingConvs ? (
              <div className="p-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>
            ) : conversations.map(c => {
              const peer = role === "tenant" ? c.landlord : c.tenant;
              return (
                <button key={c.id} onClick={() => navigate(`/messages?c=${c.id}`)}
                  className={`w-full text-left p-3 flex items-center gap-3 border-b hover:bg-muted ${activeId === c.id ? "bg-primary-soft" : ""}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={peer?.avatar_url ?? undefined} />
                    <AvatarFallback>{peer?.full_name?.[0] ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{peer?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.listing?.title ?? "Listing"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 grid place-items-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b flex items-center justify-between gap-3 bg-muted/10">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 border shadow-sm">
                    <AvatarImage src={other?.avatar_url ?? undefined} />
                    <AvatarFallback>{other?.full_name?.[0] ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {/* FULL PROFILE ACCESS FOR LANDLORDS */}
                      {role === "landlord" && other ? (
                        <Link 
                          to={`/history/${other.id}`} 
                          className="font-bold text-sm truncate hover:text-primary hover:underline flex items-center gap-1 group"
                        >
                          {other.full_name || "Unknown user"}
                          <User className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                          <ShieldCheck className="h-3.5 w-3.5 text-primary opacity-60" />
                        </Link>
                      ) : (
                        <p className="font-bold text-sm truncate">{other?.full_name || "Unknown user"}</p>
                      )}
                      <Badge variant="outline" className="text-[9px] uppercase h-5">
                        {role === "tenant" ? "Landlord" : "Tenant"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-medium">{active.listing?.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {agreement && (
                    <Badge variant={agreement.status === "accepted" ? "default" : agreement.status === "rejected" ? "destructive" : "secondary"} className="capitalize">
                      {agreement.status}
                    </Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={callPeer} className="h-9 w-9 p-0">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Agreement logic section */}
              {active.listing && (role === "tenant" || (role === "landlord" && agreement)) && (
                <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground truncate">
                    Rent: <strong className="text-foreground">{fmtBDT(active.listing.price)}</strong>/month
                    {agreement && <span className="ml-2">· proposed at <strong>{fmtBDT(Number(agreement.agreed_price))}</strong></span>}
                  </span>
                  {role === "tenant" && !agreement && (
                    <Button size="sm" variant="outline" onClick={proposeAgreement}>
                      <Handshake className="h-3.5 w-3.5 mr-1" /> Propose deal
                    </Button>
                  )}
                  {role === "tenant" && agreement?.status === "accepted" && (!agreement.payments || agreement.payments.length === 0) && (
                    <Button size="sm" onClick={() => navigate(`/payment/${agreement.id}`)}>
                      <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay now
                    </Button>
                  )}
                  {role === "landlord" && agreement?.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => respondToAgreement("rejected")}>Reject</Button>
                      <Button size="sm" onClick={() => respondToAgreement("accepted")}>Accept</Button>
                    </div>
                  )}
                </div>
              )}

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
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
                <Button type="submit" disabled={sending || !draft.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}