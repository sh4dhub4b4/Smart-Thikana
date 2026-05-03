/**
 * TenantHome — browse listings.
 *
 * Two browsing modes:
 *   1. "Near me" (default if browser geolocation succeeds) — listings sorted
 *      by distance from the user's current GPS coordinates.
 *   2. "By location" — Division → District → Thana cascade dropdowns that
 *      filter the result set.
 *
 * Tenants can also search by title and cap the max price.
 */
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Listing, PROPERTY_TYPES, fmtBDT } from "@/lib/listings";
import {
  fetchDivisions, fetchDistricts, fetchThanas,
  Division, District, Thana, distanceKm,
} from "@/lib/bd-locations";
import ListingCard from "@/components/listings/ListingCard";
import { useFavorites } from "@/hooks/useFavorites";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Mode = "near" | "by_location";

export default function TenantHome() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("near");

  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(100000);

  // Location-based filter state
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [thanas, setThanas] = useState<Thana[]>([]);
  const [fDivision, setFDivision] = useState("");
  const [fDistrict, setFDistrict] = useState("");
  const [fThana, setFThana] = useState("");

  // Geolocation state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const { favoriteIds, toggle } = useFavorites();

  // Load all active listings once
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("listings").select("*").eq("is_active", true)
        .order("created_at", { ascending: false });
      setListings((data as Listing[]) ?? []);
      setLoading(false);
    })();
  }, []);

  // Load BD divisions for the location filter
  useEffect(() => { fetchDivisions().then(setDivisions); }, []);
  useEffect(() => { setDistricts([]); setFDistrict(""); setThanas([]); setFThana("");
    if (fDivision) fetchDistricts(fDivision).then(setDistricts);
  }, [fDivision]);
  useEffect(() => { setThanas([]); setFThana("");
    if (fDivision && fDistrict) fetchThanas(fDivision, fDistrict).then(setThanas);
  }, [fDivision, fDistrict]);

  // Try geolocation on mount (user can deny — that's fine, mode falls back).
  useEffect(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoLoading(false); },
      () => setGeoLoading(false),
      { timeout: 8000 }
    );
  }, []);

  /** Manual re-request of geolocation (button on the toolbar). */
  const requestLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoLoading(false); toast.success("Using your current location"); },
      () => { setGeoLoading(false); toast.error("Could not access your location"); }
    );
  };

  // Apply filters + sort
  const filtered = useMemo(() => {
    let result = listings.filter(l => {
      if (type !== "all" && l.property_type !== type) return false;
      if (l.price > maxPrice) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${l.title} ${l.location} ${l.area_moholla ?? ""} ${l.thana ?? ""} ${l.district ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (mode === "by_location") {
        if (fDivision && l.division !== fDivision) return false;
        if (fDistrict && l.district !== fDistrict) return false;
        if (fThana && l.thana !== fThana) return false;
      }
      return true;
    });

    // In "near me" mode and we have coordinates → sort by distance for listings
    // that have lat/lng. Listings without coordinates fall to the bottom.
    if (mode === "near" && coords) {
      result = [...result].sort((a, b) => {
        const da = a.latitude && a.longitude ? distanceKm(coords.lat, coords.lng, a.latitude, a.longitude) : Infinity;
        const db = b.latitude && b.longitude ? distanceKm(coords.lat, coords.lng, b.latitude, b.longitude) : Infinity;
        return da - db;
      });
    }
    return result;
  }, [listings, search, type, maxPrice, mode, coords, fDivision, fDistrict, fThana]);

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold">Find your next home</h1>
          <p className="text-muted-foreground">Browse {listings.length} verified listings.</p>
        </div>
        <Button variant="outline" onClick={requestLocation} disabled={geoLoading}>
          {geoLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
          {coords ? "Update my location" : "Use my location"}
        </Button>
      </div>

      {/* Mode tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="mb-4">
        <TabsList>
          <TabsTrigger value="near" disabled={!coords}>
            <MapPin className="h-3.5 w-3.5 mr-1" /> Near me
          </TabsTrigger>
          <TabsTrigger value="by_location">By location</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-[1fr_180px_220px] mb-4 items-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, area, thana..." className="pl-9" />
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

      {/* Cascading location filters (only when on the "by location" tab) */}
      {mode === "by_location" && (
        <div className="grid gap-3 sm:grid-cols-3 mb-6">
          <Select value={fDivision} onValueChange={setFDivision}>
            <SelectTrigger><SelectValue placeholder="Division" /></SelectTrigger>
            <SelectContent>{divisions.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fDistrict} onValueChange={setFDistrict} disabled={!fDivision}>
            <SelectTrigger><SelectValue placeholder={fDivision ? "District" : "Pick division"} /></SelectTrigger>
            <SelectContent>{districts.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={fThana} onValueChange={setFThana} disabled={!fDistrict}>
            <SelectTrigger><SelectValue placeholder={fDistrict ? "Thana" : "Pick district"} /></SelectTrigger>
            <SelectContent>{thanas.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

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
