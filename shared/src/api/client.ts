import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error(
      "Supabase client not initialized. Call initSupabaseClient(url, key) first."
    );
  }
  return supabaseInstance;
}

export function initSupabaseClient(
  supabaseUrl: string,
  supabasePublishableKey: string,
  storage: any = undefined
): SupabaseClient {
  supabaseInstance = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      storage: storage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return supabaseInstance;
}
