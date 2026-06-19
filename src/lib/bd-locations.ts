/**
 * Helpers for the BD administrative hierarchy lookup tables
 * (divisions → districts → thanas).
 *
 * The tables are seeded server-side and publicly readable. We expose simple
 * fetcher functions that React Query / useEffect components can call.
 */
import { supabase } from "@/integrations/supabase/client";

export interface Division { id: number; name: string; name_bn: string | null }
export interface District { id: number; division_id: number; name: string; name_bn: string | null }
export interface Thana    { id: number; district_id: number; name: string; name_bn: string | null }

export const CITY_CORPS = [
  { value: "none", label: "Not a city corporation" },
  { value: "DNCC", label: "DNCC (Dhaka North)" },
  { value: "DSCC", label: "DSCC (Dhaka South)" },
] as const;

export const BUILDING_TYPES = [
  { value: "residential_flat",  label: "Residential Flat" },
  { value: "standalone_house",  label: "Standalone House" },
  { value: "commercial_studio", label: "Commercial / Studio" },
  { value: "sublet_mess",       label: "Sub-let / Mess" },
] as const;

/** Fetch all divisions, ordered alphabetically. */
export async function fetchDivisions(): Promise<Division[]> {
  const { data, error } = await supabase.from("divisions").select("*").order("name");
  if (error) { console.error("fetchDivisions error:", error); return []; }
  return (data as Division[]) ?? [];
}

/** Fetch districts for a given division name (or all if not provided). */
export async function fetchDistricts(divisionName?: string): Promise<District[]> {
  if (!divisionName) return [];
  const { data: div, error: divErr } = await supabase.from("divisions").select("id").eq("name", divisionName).maybeSingle();
  if (divErr) { console.error("fetchDistricts division error:", divErr); return []; }
  if (!div) return [];
  const { data, error } = await supabase.from("districts").select("*").eq("division_id", div.id).order("name");
  if (error) { console.error("fetchDistricts error:", error); return []; }
  return (data as District[]) ?? [];
}

/** Fetch thanas for a given district name + division (district names can repeat across divisions). */
export async function fetchThanas(divisionName?: string, districtName?: string): Promise<Thana[]> {
  if (!divisionName || !districtName) return [];
  const { data: div, error: divErr } = await supabase.from("divisions").select("id").eq("name", divisionName).maybeSingle();
  if (divErr) { console.error("fetchThanas division error:", divErr); return []; }
  if (!div) return [];
  const { data: dist, error: distErr } = await supabase.from("districts")
    .select("id").eq("division_id", div.id).eq("name", districtName).maybeSingle();
  if (distErr) { console.error("fetchThanas district error:", distErr); return []; }
  if (!dist) return [];
  const { data, error } = await supabase.from("thanas").select("*").eq("district_id", dist.id).order("name");
  if (error) { console.error("fetchThanas error:", error); return []; }
  return (data as Thana[]) ?? [];
}

/** Haversine distance in km between two lat/lng pairs. */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}
