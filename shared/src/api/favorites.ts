import { getSupabaseClient } from "./client";

export async function toggleFavorite(
  userId: string,
  listingId: string,
  isFavorite: boolean
): Promise<void> {
  const supabase = getSupabaseClient();
  if (isFavorite) {
    await supabase.from("favorites").delete().eq("user_id", userId).eq("listing_id", listingId);
  } else {
    await supabase.from("favorites").insert({ user_id: userId, listing_id: listingId });
  }
}

export async function fetchFavoriteIds(userId: string): Promise<Set<string>> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("favorites").select("listing_id").eq("user_id", userId);
  return new Set((data ?? []).map((r: any) => r.listing_id));
}

export async function fetchFavoriteListings(userId: string): Promise<any[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("favorites")
    .select("listing:listings(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r: any) => r.listing).filter(Boolean);
}
