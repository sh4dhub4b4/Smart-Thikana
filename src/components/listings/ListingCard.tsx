/**
 * ListingCard — compact card used in browse + favorites grids.
 */
import { Link } from "react-router-dom";
import { Heart, MapPin, BedDouble, Bath } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Listing, fmtBDT, placeholderImage } from "@/lib/listings";

interface Props {
  listing: Listing;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export default function ListingCard({ listing, isFavorite, onToggleFavorite }: Props) {
  const img = listing.images?.[0] || placeholderImage(listing.id);
  return (
    <Card className="card-elevated overflow-hidden group flex flex-col">
      <Link to={`/listings/${listing.id}`} className="block relative aspect-[4/3] overflow-hidden">
        <img src={img} alt={listing.title} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border">
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
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> <span className="line-clamp-1">{listing.location}</span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {listing.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {listing.bathrooms}</span>
          {listing.area_sqft && <span>{listing.area_sqft} sqft</span>}
        </div>
        <div className="mt-auto pt-4 flex items-baseline justify-between">
          <span className="font-display text-lg font-bold text-primary">{fmtBDT(listing.price)}</span>
          <span className="text-xs text-muted-foreground">/ month</span>
        </div>
      </div>
    </Card>
  );
}
