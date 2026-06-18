import { getSupabaseClient } from "./client";
import type { Listing, Profile } from "../types";

export async function fetchListings(params?: {
  division?: string;
  district?: string;
  thana?: string;
  propertyType?: string;
  maxPrice?: number;
  search?: string;
}): Promise<Listing[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("listings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (params?.division) query = query.eq("division", params.division);
  if (params?.district) query = query.eq("district", params.district);
  if (params?.thana) query = query.eq("thana", params.thana);
  if (params?.propertyType) query = query.eq("property_type", params.propertyType);
  if (params?.maxPrice) query = query.lte("price", params.maxPrice);
  if (params?.search) {
    query = query.or(
      `title.ilike.%${params.search}%,location.ilike.%${params.search}%,area_moholla.ilike.%${params.search}%,thana.ilike.%${params.search}%`
    );
  }

  const { data } = await query;
  return (data as Listing[]) ?? [];
}

export async function fetchListingById(id: string): Promise<Listing | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  return data as Listing | null;
}

export async function fetchListingWithLandlord(id: string): Promise<{
  listing: Listing | null;
  landlord: Profile | null;
}> {
  const supabase = getSupabaseClient();
  const { data: listing } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing) return { listing: null, landlord: null };
  const { data: landlord } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", listing.landlord_id)
    .maybeSingle();
  return { listing: listing as Listing, landlord: landlord as Profile | null };
}

export async function fetchMyListings(landlordId: string): Promise<Listing[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false });
  return (data as Listing[]) ?? [];
}

export async function createListing(listing: Omit<Listing, "id" | "created_at">): Promise<Listing | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("listings").insert(listing).select().single();
  return data as Listing | null;
}

export async function updateListing(id: string, updates: Partial<Listing>): Promise<Listing | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("listings").update(updates).eq("id", id).select().single();
  return data as Listing | null;
}

export async function deleteListing(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from("listings").delete().eq("id", id);
}

export async function fetchLandlordListingsWithDetails(landlordId: string): Promise<(Listing & { agreementCount?: number })[]> {
  const supabase = getSupabaseClient();
  const listings = await fetchMyListings(landlordId);
  const enriched = await Promise.all(
    listings.map(async (l) => {
      const { count } = await supabase
        .from("agreements")
        .select("*", { count: "exact", head: true })
        .eq("listing_id", l.id)
        .in("status", ["pending", "active"]);
      return { ...l, agreementCount: count ?? 0 };
    })
  );
  return enriched;
}
