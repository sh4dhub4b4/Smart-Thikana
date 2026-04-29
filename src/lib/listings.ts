/**
 * Shared types matching the public schema.
 */
export type PropertyType = "apartment" | "house" | "studio" | "room" | "commercial";

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
}

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Room" },
  { value: "commercial", label: "Commercial" },
];

/** Format BDT money */
export const fmtBDT = (n: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(n);

/** Stable placeholder image for a listing without images */
export const placeholderImage = (seed: string) =>
  `https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=70&sig=${encodeURIComponent(seed)}`;
