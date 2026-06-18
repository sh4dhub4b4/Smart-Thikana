export type PropertyType = "apartment" | "house" | "studio" | "room" | "commercial";
export type CityCorp = "none" | "DNCC" | "DSCC";
export type BuildingType = "residential_flat" | "standalone_house" | "commercial_studio" | "sublet_mess";
export type AppRole = "tenant" | "landlord";
export type AgreementStatus = "pending" | "accepted" | "rejected" | "active";
export type PaymentStatus = "pending" | "completed" | "failed";
export type KycStatus = "pending" | "verified" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  business_name: string | null;
  preferences: Record<string, unknown>;
}

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

export interface Conversation {
  id: string;
  listing_id: string;
  tenant_id: string;
  landlord_id: string;
  created_at: string;
  updated_at: string;
  listing?: Pick<Listing, "id" | "title" | "price" | "images">;
  tenant?: Pick<Profile, "id" | "full_name" | "avatar_url">;
  landlord?: Pick<Profile, "id" | "full_name" | "avatar_url">;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Agreement {
  id: string;
  conversation_id: string;
  listing_id: string;
  tenant_id: string;
  landlord_id: string;
  proposed_price: number;
  status: AgreementStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  agreement_id: string;
  tenant_id: string;
  landlord_id: string;
  amount: number;
  status: PaymentStatus;
  receipt_number: string | null;
  created_at: string;
}

export interface RentInvoice {
  id: string;
  agreement_id: string;
  tenant_id: string;
  landlord_id: string;
  amount: number;
  status: string;
  type: string;
  due_date: string;
  created_at: string;
}

export interface Kyc {
  id: string;
  user_id: string;
  nid_number: string;
  nid_front_url: string | null;
  nid_back_url: string | null;
  selfie_url: string | null;
  status: KycStatus;
  created_at: string;
}

export interface Feedback {
  id: string;
  reviewer_id: string;
  subject_id: string;
  role: AppRole;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Pick<Profile, "id" | "full_name" | "avatar_url">;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string | null;
}

export interface ServiceProvider {
  id: string;
  user_id: string;
  category_id: string;
  hourly_rate: number;
  experience_years: number;
  company_name: string | null;
  category?: ServiceCategory;
}

export interface ServiceBooking {
  id: string;
  provider_id: string;
  tenant_id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface Division { id: number; name: string; name_bn: string | null }
export interface District { id: number; division_id: number; name: string; name_bn: string | null }
export interface Thana { id: number; district_id: number; name: string; name_bn: string | null }

export interface TaxBreakdown {
  gross_rent: number;
  tds_amount: number;
  advance_tax_this_month: number;
  platform_fee: number;
  net_to_landlord: number;
}
