import { getSupabaseClient } from "./client";
import type { Conversation, Message } from "../types";

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("conversations")
    .select(`
      *,
      listing:listings(id, title, price, images),
      tenant:profiles!conversations_tenant_id_fkey(id, full_name, avatar_url),
      landlord:profiles!conversations_landlord_id_fkey(id, full_name, avatar_url)
    `)
    .or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`)
    .order("updated_at", { ascending: false });
  return (data as Conversation[]) ?? [];
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return (data as Message[]) ?? [];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select()
    .single();
  return data as Message | null;
}

export async function createConversation(
  listingId: string,
  tenantId: string,
  landlordId: string
): Promise<Conversation | null> {
  const supabase = getSupabaseClient();
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("listing_id", listingId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (existing) return existing as Conversation;

  const { data } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, tenant_id: tenantId, landlord_id: landlordId })
    .select()
    .single();
  return data as Conversation | null;
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void
) {
  const supabase = getSupabaseClient();
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();
  return () => channel.unsubscribe();
}

export function subscribeToNewMessages(
  userId: string,
  onMessage: (message: Message) => void
) {
  const supabase = getSupabaseClient();
  const channel = supabase
    .channel(`new-messages:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();
  return () => channel.unsubscribe();
}
