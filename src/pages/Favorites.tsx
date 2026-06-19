/**
 * Favorites — tenant's saved listings.
 *
 * The list of favorite IDs comes from `useFavorites` (cached in React state
 * + persisted to the `favorites` table). We then fetch the corresponding
 * listing rows and render them with the standard <ListingCard> grid.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Listing } from "@/lib/listings";
import ListingCard from "@/components/listings/ListingCard";
import { useFavorites } from "@/hooks/useFavorites";
import { Heart } from "lucide-react";

export default function Favorites() {
  const { user } = useAuth();
  const { favoriteIds, toggle } = useFavorites();
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      const ids = Array.from(favoriteIds);
      if (ids.length === 0) { if (!cancelled) setListings([]); return; }
      try {
        const { data, error } = await supabase.from("listings").select("*").in("id", ids).eq("is_active", true);
        if (!cancelled && !error) setListings((data as Listing[]) ?? []);
      } catch (err) {
        if (!cancelled) console.error("Failed to load favorites:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [user, favoriteIds]);

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl font-bold mb-1">Saved Listings</h1>
      <p className="text-muted-foreground mb-8">{listings.length} saved.</p>
      {listings.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <Heart className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">You haven't saved any listings yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map(l => (
            <ListingCard key={l.id} listing={l} isFavorite={favoriteIds.has(l.id)} onToggleFavorite={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}
