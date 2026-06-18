export interface Division { id: number; name: string; name_bn: string | null }
export interface District { id: number; division_id: number; name: string; name_bn: string | null }
export interface Thana { id: number; district_id: number; name: string; name_bn: string | null }

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
