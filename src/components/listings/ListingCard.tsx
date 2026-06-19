/**
 * ListingCard — compact card used in browse + favorites grids.
 * Shows the structured BD address (Moholla, Thana, District) when available,
 * and falls back to the legacy free-text `location` field otherwise.
 */
import { Link } from "react-router-dom";
import { Heart, MapPin, BedDouble, Bath, Maximize } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Listing, fmtBDT, placeholderImage, formatAddress } from "@/lib/listings";

interface Props {
  listing: Listing;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export default function ListingCard({ listing, isFavorite, onToggleFavorite }: Props) {
  const img = listing.images?.[0] || placeholderImage(listing.id);
  const address = formatAddress(listing);

  return (
    <Card className="card-elevated overflow-hidden group flex flex-col">
      <Link to={`/listings/${listing.id}`} className="block relative aspect-[4/3] overflow-hidden">
        <img src={img} alt={listing.title} loading="lazy"
          onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.fall) { t.dataset.fall = "1"; t.src = `https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(listing.title?.[0] || 'P')}`; } }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border capitalize">
          {listing.property_type}
        </Badge>
        {onToggleFavorite && (
          <Button
            type="button" size="icon" variant="secondary"
            onClick={(e) => { e.preventDefault(); onToggleFavorite(listing.id); }}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/90 hover:bg-background"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-accent text-accent" : ""}`} />
          </Button>
        )}
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <Link to={`/listings/${listing.id}`} className="font-display font-semibold text-base hover:text-primary line-clamp-1">
          {listing.title}
        </Link>
        <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{address}</span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {listing.bedrooms} bd</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {listing.bathrooms} ba</span>
          {listing.area_sqft && (
            <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {listing.area_sqft} sqft</span>
          )}
        </div>
        <div className="mt-auto pt-4 flex items-baseline justify-between">
          <span className="font-display text-lg font-bold text-primary">{fmtBDT(listing.price)}</span>
          <span className="text-xs text-muted-foreground">/ month</span>
        </div>
      </div>
    </Card>
  );
}
