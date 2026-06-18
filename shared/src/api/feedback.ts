import { getSupabaseClient } from "./client";
import type { Feedback } from "../types";

export async function fetchFeedback(role?: "tenant" | "landlord"): Promise<Feedback[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("feedback")
    .select("*, reviewer:profiles!feedback_reviewer_id_fkey(id, full_name, avatar_url)")
    .order("created_at", { ascending: false });

  if (role) {
    query = role === "tenant"
      ? query.eq("role", "landlord")
      : query.eq("role", "tenant");
  }

  const { data } = await query;
  return (data as Feedback[]) ?? [];
}

export async function submitFeedback(
  reviewerId: string,
  subjectId: string,
  role: "tenant" | "landlord",
  rating: number,
  comment?: string
): Promise<Feedback | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("feedback")
    .insert({
      reviewer_id: reviewerId,
      subject_id: subjectId,
      role,
      rating,
      comment: comment || null,
    })
    .select()
    .single();
  return data as Feedback | null;
}
