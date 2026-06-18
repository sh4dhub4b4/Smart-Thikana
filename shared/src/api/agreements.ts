import { getSupabaseClient } from "./client";
import type { Agreement } from "../types";

export async function fetchAgreementsByUser(userId: string): Promise<Agreement[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("agreements")
    .select("*")
    .or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  return (data as Agreement[]) ?? [];
}

export async function fetchAgreementsByConversation(conversationId: string): Promise<Agreement[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("agreements")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });
  return (data as Agreement[]) ?? [];
}

export async function createAgreement(
  conversationId: string,
  listingId: string,
  tenantId: string,
  landlordId: string,
  proposedPrice: number
): Promise<Agreement | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("agreements")
    .insert({
      conversation_id: conversationId,
      listing_id: listingId,
      tenant_id: tenantId,
      landlord_id: landlordId,
      proposed_price: proposedPrice,
      status: "pending",
    })
    .select()
    .single();
  return data as Agreement | null;
}

export async function updateAgreementStatus(
  agreementId: string,
  status: "accepted" | "rejected" | "active"
): Promise<Agreement | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("agreements")
    .update({ status })
    .eq("id", agreementId)
    .select()
    .single();
  return data as Agreement | null;
}
