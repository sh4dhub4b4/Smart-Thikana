export type PropertyType = "apartment" | "house" | "studio" | "room" | "commercial";
export type CityCorp = "none" | "DNCC" | "DSCC";
export type BuildingType = "residential_flat" | "standalone_house" | "commercial_studio" | "sublet_mess";

export interface Listing {
  id: string;
  landlord_id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number | null;
  images: string[];
  is_active: boolean;
  created_at: string;
  division: string | null;
  district: string | null;
  city_corporation: CityCorp;
  thana: string | null;
  ward_number: number | null;
  zone: string | null;
  area_moholla: string | null;
  block_sector: string | null;
  road_no: string | null;
  avenue_lane: string | null;
  holding_number: string | null;
  house_name: string | null;
  floor_unit: string | null;
  landmarks: string | null;
  geo_location: string | null;
  building_type: BuildingType;
  latitude: number | null;
  longitude: number | null;
}

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Room" },
  { value: "commercial", label: "Commercial" },
];

export const fmtBDT = (n: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n);

export const placeholderImage = (seed: string) =>
  `https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=70&sig=${encodeURIComponent(seed)}`;

export function formatAddress(l: Pick<Listing,
  "house_name" | "road_no" | "area_moholla" | "block_sector" | "thana" | "district" | "division" | "location"
>): string {
  const parts = [
    l.house_name,
    l.road_no ? `Road ${l.road_no}` : null,
    l.area_moholla,
    l.block_sector,
    l.thana,
    l.district,
    l.division,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : (l.location || "Address not provided");
}
