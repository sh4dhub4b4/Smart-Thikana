/**
 * =============================================================================
 * useFavorites — read & toggle the current user's favorite listings.
 * =============================================================================
 * Backed by the public.favorites table (composite-unique on user_id+listing_id).
 *
 * Strategy:
 *   - On mount / when `user` changes, fetch the IDs of all listings the user
 *     has favorited (just IDs, not full listing rows — fast and small).
 *   - `toggle()` does an OPTIMISTIC update: it changes local state first, then
 *     fires the DB write. If the write fails, the next `refresh()` will sync
 *     state back to truth. This makes the heart icon feel instant.
 *
 * Security:
 *   The favorites table has RLS policies that only allow each user to
 *   select / insert / delete their OWN rows. So even if a malicious client
 *   tried to favorite something on behalf of another user, Postgres would
 *   reject the write. We still gate it with `if (!user) return` for clarity.
 * =============================================================================
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFavorites() {
  const { user } = useAuth();

  // We store IDs in a Set for O(1) `has()` lookup from listing cards.
  const [ids, setIds] = useState<Set<string>>(new Set());

  /** (Re)fetch the current user's favorite listing IDs from the DB. */
  const refresh = useCallback(async () => {
    if (!user) {
      setIds(new Set());            // Logged out → no favorites
      return;
    }
    const { data } = await supabase
      .from("favorites")
      .select("listing_id")          // Only the column we need
      .eq("user_id", user.id);       // Redundant w/ RLS but makes intent clear
    setIds(new Set(data?.map((d) => d.listing_id) ?? []));
  }, [user]);

  // Run once on mount and whenever the user changes (login / logout).
  useEffect(() => { refresh(); }, [refresh]);

  /**
   * Add or remove a listing from favorites.
   * Optimistic: state is updated immediately for snappy UI.
   */
  const toggle = async (listingId: string) => {
    if (!user) return;  // Defensive — UI should hide the heart for guests.

    if (ids.has(listingId)) {
      // ── Currently favorited → remove ────────────────────────────────────
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);

      setIds((prev) => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    } else {
      // ── Not favorited yet → add ─────────────────────────────────────────
      // The UNIQUE(user_id, listing_id) constraint on the table prevents
      // duplicate rows even under double-click race conditions.
      await supabase
        .from("favorites")
        .insert({ user_id: user.id, listing_id: listingId });

      setIds((prev) => new Set(prev).add(listingId));
    }
  };

  return { favoriteIds: ids, toggle, refresh };
}
