/**
 * ListingDetail — full listing page with landlord info, message + call buttons.
 * Tenants can start a conversation here, which lands them in /messages.
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, BedDouble, Bath, MapPin, Heart, Phone, MessageSquare, Loader2, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Listing, fmtBDT, placeholderImage, formatAddress } from "@/lib/listings";
import { CITY_CORPS, BUILDING_TYPES } from "@/lib/bd-locations";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";

interface LandlordInfo { id: string; full_name: string; phone: string | null; avatar_url: string | null; business_name: string | null; }

/** Tiny presentational row for the structured property-details card. */
function DetailRow({ label, value }: { label: string; value: React.ReactNode | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 py-1 border-b border-border/40 last:border-0">
      <dt className="text-muted-foreground text-xs uppercase tracking-wider">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { favoriteIds, toggle } = useFavorites();

  const [listing, setListing] = useState<Listing | null>(null);
  const [landlord, setLandlord] = useState<LandlordInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: l } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
      setListing(l as Listing | null);
      if (l) {
        const { data: p } = await supabase.from("profiles")
          .select("id, full_name, phone, avatar_url, business_name")
          .eq("id", l.landlord_id).maybeSingle();
        setLandlord(p as LandlordInfo | null);
      }
      setLoading(false);
    })();
  }, [id]);

  const startConversation = async () => {
    if (!user || !listing) return;
    if (role !== "tenant") { toast.error("Only tenants can message landlords"); return; }
    setStarting(true);
    // Try find existing — `.limit(1).maybeSingle()` defends against any rare
    // duplicate-conversation edge cases without throwing.
    const { data: existing } = await supabase.from("conversations")
      .select("id").eq("listing_id", listing.id).eq("tenant_id", user.id).limit(1).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: created, error } = await supabase.from("conversations").insert({
        listing_id: listing.id, tenant_id: user.id, landlord_id: listing.landlord_id,
      }).select("id").single();
      if (error) { toast.error(error.message); setStarting(false); return; }
      convId = created.id;
    }
    setStarting(false);
    navigate(`/messages?c=${convId}`);
  };

  if (loading) return <div className="container py-20 grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!listing) return <div className="container py-20 text-center"><p>Listing not found.</p></div>;

  const images = listing.images.length > 0 ? listing.images : [placeholderImage(listing.id)];

  return (
    <div className="container py-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          <div className="grid grid-cols-4 gap-2 rounded-lg overflow-hidden">
            <img src={images[0]} alt={listing.title} className="col-span-4 md:col-span-3 row-span-2 aspect-[4/3] md:aspect-auto h-full w-full object-cover" />
            {images.slice(1, 5).map((src, i) => (
              <img key={i} src={src} alt="" loading="lazy"
                className="hidden md:block aspect-square w-full object-cover" />
            ))}
          </div>

          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge variant="secondary" className="mb-2 capitalize">{listing.property_type}</Badge>
                <h1 className="font-display text-3xl font-bold">{listing.title}</h1>
                <div className="flex items-start gap-1 text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" /> <span>{formatAddress(listing)}</span>
                </div>
              </div>
              {role === "tenant" && (
                <Button variant="outline" size="icon" onClick={() => toggle(listing.id)}>
                  <Heart className={`h-4 w-4 ${favoriteIds.has(listing.id) ? "fill-accent text-accent" : ""}`} />
                </Button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 max-w-md">
              <Card className="p-3 text-center"><BedDouble className="h-5 w-5 mx-auto text-primary mb-1" /><div className="text-sm font-semibold">{listing.bedrooms} Beds</div></Card>
              <Card className="p-3 text-center"><Bath className="h-5 w-5 mx-auto text-primary mb-1" /><div className="text-sm font-semibold">{listing.bathrooms} Baths</div></Card>
              <Card className="p-3 text-center"><Maximize className="h-5 w-5 mx-auto text-primary mb-1" /><div className="text-sm font-semibold">{listing.area_sqft || "—"} sqft</div></Card>
            </div>

            {/* Full structured address & classification — every detail the landlord
                entered is shown here so tenants can verify what they're renting. */}
            <Card className="mt-6 p-4">
              <h2 className="font-display text-lg font-semibold mb-3">Property details</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <DetailRow label="Building type" value={BUILDING_TYPES.find(b => b.value === listing.building_type)?.label} />
                <DetailRow label="Division" value={listing.division} />
                <DetailRow label="District" value={listing.district} />
                <DetailRow label="Thana / PS" value={listing.thana} />
                <DetailRow label="City Corporation" value={CITY_CORPS.find(c => c.value === listing.city_corporation)?.label} />
                <DetailRow label="Ward number" value={listing.ward_number?.toString()} />
                <DetailRow label="Zone" value={listing.zone} />
                <DetailRow label="Area / Moholla" value={listing.area_moholla} />
                <DetailRow label="Block / Sector" value={listing.block_sector} />
                <DetailRow label="Road no" value={listing.road_no} />
                <DetailRow label="Avenue / Lane" value={listing.avenue_lane} />
                <DetailRow label="Holding number" value={listing.holding_number} />
                <DetailRow label="House name / no" value={listing.house_name} />
                <DetailRow label="Floor & unit" value={listing.floor_unit} />
                <DetailRow label="Landmarks" value={listing.landmarks} />
                <DetailRow label="GPS / Plus code" value={listing.geo_location} />
                {listing.latitude && listing.longitude && (
                  <DetailRow
                    label="Coordinates"
                    value={
                      <a
                        href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`}
                        target="_blank" rel="noreferrer" className="text-primary underline"
                      >
                        {listing.latitude.toFixed(5)}, {listing.longitude.toFixed(5)}
                      </a>
                    }
                  />
                )}
              </dl>
            </Card>

            <div className="mt-6">
              <h2 className="font-display text-lg font-semibold mb-2">About this property</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{listing.description || "No description provided."}</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card className="p-6">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-display text-3xl font-bold text-primary">{fmtBDT(listing.price)}</span>
              <span className="text-muted-foreground text-sm">/ month</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Listed on {new Date(listing.created_at).toLocaleDateString()}</p>

            {landlord && (
              <Link to={`#`} className="flex items-center gap-3 p-3 rounded-md bg-muted/50 mb-4">
                <Avatar><AvatarImage src={landlord.avatar_url ?? undefined} /><AvatarFallback>{landlord.full_name?.[0] ?? "L"}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{landlord.business_name || landlord.full_name}</p>
                  <p className="text-xs text-muted-foreground">Landlord</p>
                </div>
              </Link>
            )}

            {user && role === "tenant" ? (
              <div className="space-y-2">
                <Button className="w-full" onClick={startConversation} disabled={starting}>
                  {starting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                  Message Landlord
                </Button>
                <Button asChild variant="outline" className="w-full" disabled={!landlord?.phone}>
                  {landlord?.phone
                    ? <a href={`tel:${landlord.phone}`}><Phone className="h-4 w-4 mr-2" /> Call {landlord.phone}</a>
                    : <span><Phone className="h-4 w-4 mr-2" /> Phone not provided</span>}
                </Button>
              </div>
            ) : !user ? (
              <Button className="w-full" onClick={() => navigate("/auth")}>Sign in to contact</Button>
            ) : (
              <p className="text-xs text-muted-foreground text-center">Sign in as a tenant to contact the landlord.</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
