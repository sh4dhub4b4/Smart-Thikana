/**
 * useFavorites — fetches and toggles the current user's favorites.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFavorites() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!user) { setIds(new Set()); return; }
    const { data } = await supabase.from("favorites").select("listing_id").eq("user_id", user.id);
    setIds(new Set(data?.map(d => d.listing_id) ?? []));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (listingId: string) => {
    if (!user) return;
    if (ids.has(listingId)) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listingId);
      setIds(prev => { const n = new Set(prev); n.delete(listingId); return n; });
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, listing_id: listingId });
      setIds(prev => new Set(prev).add(listingId));
    }
  };

  return { favoriteIds: ids, toggle, refresh };
}
