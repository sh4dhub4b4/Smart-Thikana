import { getSupabaseClient } from "./client";
import type { ServiceCategory, ServiceProvider, ServiceBooking } from "../types";

export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.from("service_categories").select("*").order("name");
  return (data as ServiceCategory[]) ?? [];
}

export async function fetchServiceProviders(categoryId?: string): Promise<ServiceProvider[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("service_providers")
    .select("*, category:service_categories(*)");
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data } = await query;
  return (data as ServiceProvider[]) ?? [];
}

export async function createServiceBooking(
  providerId: string,
  tenantId: string,
  scheduledAt: string,
  notes?: string
): Promise<ServiceBooking | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("service_bookings")
    .insert({
      provider_id: providerId,
      tenant_id: tenantId,
      scheduled_at: scheduledAt,
      status: "pending",
      notes: notes || null,
    })
    .select()
    .single();
  return data as ServiceBooking | null;
}
