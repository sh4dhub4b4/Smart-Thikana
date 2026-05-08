import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── 1. Types ─────────────────────────────────────────────────────────────
// We type these based on your existing database schema to ensure type safety
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
}

// ─── 2. Supabase Data Fetching Functions ──────────────────────────────────
export const fetchCategories = async (): Promise<ServiceCategory[]> => {
    const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

    if (error) throw new Error(error.message);
    return data || [];
};

export const fetchProviders = async (categoryId?: string | null): Promise<ServiceProvider[]> => {
    let query = supabase.from("service_providers").select("*");

    // If a user clicks a specific category tab, we filter. Otherwise, fetch all.
    if (categoryId) {
        query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
};

// ─── 3. React Query Hooks ─────────────────────────────────────────────────
export const useServiceCategories = () => {
    return useQuery({
        queryKey: ["service_categories"],
        queryFn: fetchCategories,
    });
};

export const useServiceProviders = (categoryId?: string | null) => {
    return useQuery({
        queryKey: ["service_providers", categoryId],
        queryFn: () => fetchProviders(categoryId),
    });
};