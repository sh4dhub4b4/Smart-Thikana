/**
 * TenantHome — browse + filter listings.
 */
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { Listing, PROPERTY_TYPES, fmtBDT } from "@/lib/listings";
import ListingCard from "@/components/listings/ListingCard";
import { useFavorites } from "@/hooks/useFavorites";
import { Skeleton } from "@/components/ui/skeleton";

export default function TenantHome() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const { favoriteIds, toggle } = useFavorites();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("listings").select("*").eq("is_active", true)
        .order("created_at", { ascending: false });
      setListings((data as Listing[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => listings.filter(l => {
    if (type !== "all" && l.property_type !== type) return false;
    if (l.price > maxPrice) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!l.title.toLowerCase().includes(q) && !l.location.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [listings, search, type, maxPrice]);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Find your next home</h1>
        <p className="text-muted-foreground">Browse {listings.length} verified listings.</p>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-[1fr_220px_280px] mb-8 items-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or location" className="pl-9" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SlidersHorizontal className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Max price</span><span className="font-semibold text-foreground">{fmtBDT(maxPrice)}</span>
          </div>
          <Slider value={[maxPrice]} onValueChange={([v]) => setMaxPrice(v)} min={5000} max={200000} step={5000} />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No listings match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
          {filtered.map(l => (
            <ListingCard key={l.id} listing={l} isFavorite={favoriteIds.has(l.id)} onToggleFavorite={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}
