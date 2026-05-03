/**
 * ListingForm — create or edit a listing.
 *
 * Organized into four sections matching the BD property registration schema:
 *   1. Administrative Hierarchy (Division → District → City Corp → Thana → Ward → Zone)
 *   2. Localized Address Details (Area, Block, Road, Avenue)
 *   3. Unique Property Keys (Holding No., House Name, Floor & Unit)
 *   4. Verification & Classification (Landmarks, Geo, Building Type)
 *
 * Plus the original property facts (price, beds, baths, area, images, description).
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Loader2, ArrowLeft, MapPin, Home, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PROPERTY_TYPES, PropertyType, CityCorp, BuildingType } from "@/lib/listings";
import {
  fetchDivisions, fetchDistricts, fetchThanas,
  Division, District, Thana, CITY_CORPS, BUILDING_TYPES,
} from "@/lib/bd-locations";
import { toast } from "sonner";

// Validation schema — only the truly mandatory fields are required at the
// schema level. Optional fields are coerced to null on save.
const schema = z.object({
  title:    z.string().trim().min(3, "Title too short").max(120),
  price:    z.number().positive("Price must be > 0").max(10_000_000),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms:z.number().int().min(0).max(20),
  area_sqft:z.number().int().min(0).max(100000).nullable(),
  // BD address mandatories
  division: z.string().min(1, "Division is required"),
  district: z.string().min(1, "District is required"),
  thana:    z.string().min(1, "Thana is required"),
  area_moholla:   z.string().trim().min(2, "Area / Moholla is required"),
  holding_number: z.string().trim().min(1, "Holding number is required"),
});

export default function ListingForm() {
  const { id } = useParams<{ id: string }>();
  const editing = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Property basics ───────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(15000);
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [area, setArea] = useState<number | "">("");
  const [imagesText, setImagesText] = useState("");
  const [active, setActive] = useState(true);

  // ── Section 1: Administrative ─────────────────────────────────────────────
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [cityCorp, setCityCorp] = useState<CityCorp>("none");
  const [thana, setThana] = useState("");
  const [ward, setWard] = useState<number | "">("");
  const [zone, setZone] = useState("");

  // ── Section 2: Address ────────────────────────────────────────────────────
  const [areaMoholla, setAreaMoholla] = useState("");
  const [blockSector, setBlockSector] = useState("");
  const [roadNo, setRoadNo] = useState("");
  const [avenueLane, setAvenueLane] = useState("");

  // ── Section 3: Unique keys ────────────────────────────────────────────────
  const [holdingNumber, setHoldingNumber] = useState("");
  const [houseName, setHouseName] = useState("");
  const [floorUnit, setFloorUnit] = useState("");

  // ── Section 4: Verification ───────────────────────────────────────────────
  const [landmarks, setLandmarks] = useState("");
  const [geoLocation, setGeoLocation] = useState("");
  const [buildingType, setBuildingType] = useState<BuildingType>("residential_flat");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // ── Lookup tables ─────────────────────────────────────────────────────────
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [thanas, setThanas] = useState<Thana[]>([]);

  const [saving, setSaving] = useState(false);

  // Load divisions on mount
  useEffect(() => { fetchDivisions().then(setDivisions); }, []);
  // Load districts when division changes
  useEffect(() => {
    setDistricts([]);
    if (division) fetchDistricts(division).then(setDistricts);
  }, [division]);
  // Load thanas when district changes
  useEffect(() => {
    setThanas([]);
    if (division && district) fetchThanas(division, district).then(setThanas);
  }, [division, district]);

  // Load existing listing for edit mode
  useEffect(() => {
    if (!editing) return;
    (async () => {
      const { data } = await supabase.from("listings").select("*").eq("id", id!).maybeSingle();
      if (!data) return;
      setTitle(data.title); setDescription(data.description ?? "");
      setPrice(Number(data.price)); setPropertyType(data.property_type);
      setBedrooms(data.bedrooms); setBathrooms(data.bathrooms);
      setArea(data.area_sqft ?? ""); setImagesText((data.images ?? []).join("\n"));
      setActive(data.is_active);
      setDivision(data.division ?? ""); setDistrict(data.district ?? "");
      setCityCorp((data.city_corporation as CityCorp) ?? "none");
      setThana(data.thana ?? ""); setWard(data.ward_number ?? "");
      setZone(data.zone ?? "");
      setAreaMoholla(data.area_moholla ?? ""); setBlockSector(data.block_sector ?? "");
      setRoadNo(data.road_no ?? ""); setAvenueLane(data.avenue_lane ?? "");
      setHoldingNumber(data.holding_number ?? ""); setHouseName(data.house_name ?? "");
      setFloorUnit(data.floor_unit ?? "");
      setLandmarks(data.landmarks ?? ""); setGeoLocation(data.geo_location ?? "");
      setBuildingType((data.building_type as BuildingType) ?? "residential_flat");
      setLatitude(data.latitude); setLongitude(data.longitude);
    })();
  }, [id, editing]);

  /** Use the browser geolocation API to capture lat/lng for this listing. */
  const captureCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported by your browser"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        toast.success("Location captured");
      },
      () => toast.error("Failed to capture location — please allow location access"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      title, price: Number(price), bedrooms: Number(bedrooms), bathrooms: Number(bathrooms),
      area_sqft: area === "" ? null : Number(area),
      division, district, thana, area_moholla: areaMoholla, holding_number: holdingNumber,
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }

    const images = imagesText.split(/\n+/).map(s => s.trim()).filter(Boolean).slice(0, 10);
    // The legacy `location` column is kept in sync as a human-readable summary.
    const locationSummary = [areaMoholla, thana, district].filter(Boolean).join(", ");

    const payload = {
      // Basics
      title: parsed.data.title, description, price: parsed.data.price,
      bedrooms: parsed.data.bedrooms, bathrooms: parsed.data.bathrooms,
      area_sqft: parsed.data.area_sqft, property_type: propertyType,
      images, is_active: active, landlord_id: user.id,
      location: locationSummary,
      // Administrative
      division, district, city_corporation: cityCorp, thana,
      ward_number: ward === "" ? null : Number(ward),
      zone: zone || null,
      // Address
      area_moholla: areaMoholla,
      block_sector: blockSector || null,
      road_no: roadNo || null,
      avenue_lane: avenueLane || null,
      // Unique keys
      holding_number: holdingNumber,
      house_name: houseName || null,
      floor_unit: floorUnit || null,
      // Verification
      landmarks: landmarks ? landmarks.slice(0, 200) : null,
      geo_location: geoLocation || null,
      building_type: buildingType,
      latitude, longitude,
    };
    setSaving(true);
    const { error } = editing
      ? await supabase.from("listings").update(payload).eq("id", id!)
      : await supabase.from("listings").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Listing updated" : "Listing created");
    navigate("/landlord/listings");
  };

  return (
    <div className="container max-w-3xl py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <h1 className="font-display text-2xl font-bold mb-6">
        {editing ? "Edit Property Listing" : "Register New Property"}
      </h1>

      <form onSubmit={submit} className="space-y-6">
        {/* ─── BASICS ─────────────────────────────────────────────────────── */}
        <Card className="p-6 space-y-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" /> Property Details
          </h2>
          <div><Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Cozy 2BHK in Gulshan" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Monthly rent (BDT) *</Label>
              <Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} />
            </div>
            <div><Label>Property type *</Label>
              <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Bedrooms</Label><Input type="number" value={bedrooms} onChange={e => setBedrooms(Number(e.target.value))} /></div>
            <div><Label>Bathrooms</Label><Input type="number" value={bathrooms} onChange={e => setBathrooms(Number(e.target.value))} /></div>
            <div><Label>Area (sqft)</Label>
              <Input type="number" value={area} onChange={e => setArea(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
          </div>
          <div><Label>Description</Label>
            <Textarea rows={4} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe amenities, neighborhood, rules..." />
          </div>
          <div><Label>Image URLs (one per line, up to 10)</Label>
            <Textarea rows={3} value={imagesText} onChange={e => setImagesText(e.target.value)}
              placeholder="https://images.unsplash.com/...&#10;https://..." />
          </div>
        </Card>

        {/* ─── SECTION 1: ADMINISTRATIVE HIERARCHY ───────────────────────── */}
        <Card className="p-6 space-y-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> 1. Administrative Hierarchy
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Division *</Label>
              <Select value={division} onValueChange={(v) => { setDivision(v); setDistrict(""); setThana(""); }}>
                <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                <SelectContent>{divisions.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>District *</Label>
              <Select value={district} onValueChange={(v) => { setDistrict(v); setThana(""); }} disabled={!division}>
                <SelectTrigger><SelectValue placeholder={division ? "Select district" : "Pick division first"} /></SelectTrigger>
                <SelectContent>{districts.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Thana / PS *</Label>
              <Select value={thana} onValueChange={setThana} disabled={!district}>
                <SelectTrigger><SelectValue placeholder={district ? "Select thana" : "Pick district first"} /></SelectTrigger>
                <SelectContent>{thanas.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>City Corporation (optional)</Label>
              <RadioGroup value={cityCorp} onValueChange={(v) => setCityCorp(v as CityCorp)} className="flex gap-4 pt-2">
                {CITY_CORPS.map(c => (
                  <label key={c.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value={c.value} /> {c.label}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div><Label>Ward Number (optional, 1–99)</Label>
              <Input type="number" min={1} max={99} value={ward}
                onChange={e => setWard(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 19" />
            </div>
            <div><Label>Zone (optional)</Label>
              <Select value={zone} onValueChange={setZone}>
                <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => (
                    <SelectItem key={i + 1} value={`Zone ${i + 1}`}>Zone {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* ─── SECTION 2: LOCALIZED ADDRESS ──────────────────────────────── */}
        <Card className="p-6 space-y-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> 2. Localized Address Details
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Area / Moholla *</Label>
              <Input value={areaMoholla} onChange={e => setAreaMoholla(e.target.value)} placeholder="e.g. Middle Badda, Nikunja-2" />
            </div>
            <div><Label>Block / Sector (optional)</Label>
              <Input value={blockSector} onChange={e => setBlockSector(e.target.value)} placeholder="e.g. Block-C, Sector-4" />
            </div>
            <div><Label>Road No (optional)</Label>
              <Input value={roadNo} onChange={e => setRoadNo(e.target.value)} placeholder="e.g. Road #12, Lake Drive" />
            </div>
            <div><Label>Avenue / Lane (optional)</Label>
              <Input value={avenueLane} onChange={e => setAvenueLane(e.target.value)} placeholder="e.g. Avenue 4, Goli 2" />
            </div>
          </div>
        </Card>

        {/* ─── SECTION 3: UNIQUE PROPERTY KEYS ───────────────────────────── */}
        <Card className="p-6 space-y-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> 3. Unique Property Keys
          </h2>
          <div><Label>Holding Number *</Label>
            <Input value={holdingNumber} onChange={e => setHoldingNumber(e.target.value)}
              placeholder="Primary key for City Corporation tax records" />
            <p className="text-xs text-muted-foreground mt-1">
              Mandatory — used for Government tax verification.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>House Name / Number</Label>
              <Input value={houseName} onChange={e => setHouseName(e.target.value)} placeholder="e.g. House #45 or 'Rahman Villa'" />
            </div>
            <div><Label>Floor &amp; Unit</Label>
              <Input value={floorUnit} onChange={e => setFloorUnit(e.target.value)} placeholder="e.g. Flat 3-B, 2nd Floor" />
            </div>
          </div>
        </Card>

        {/* ─── SECTION 4: VERIFICATION & CLASSIFICATION ──────────────────── */}
        <Card className="p-6 space-y-4">
          <h2 className="font-display font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> 4. Verification &amp; Classification
          </h2>
          <div><Label>Landmarks (max 200 chars)</Label>
            <Textarea rows={2} value={landmarks} onChange={e => setLandmarks(e.target.value.slice(0, 200))}
              placeholder="e.g. Behind Badda General Hospital" />
          </div>
          <div><Label>Geo-Location (Google Maps URL or Plus Code, optional)</Label>
            <div className="flex gap-2">
              <Input value={geoLocation} onChange={e => setGeoLocation(e.target.value)}
                placeholder="https://maps.app.goo.gl/..." />
              <Button type="button" variant="outline" onClick={captureCurrentLocation}>
                <MapPin className="h-4 w-4 mr-1" /> Use my location
              </Button>
            </div>
            {latitude !== null && longitude !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                GPS captured: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            )}
          </div>
          <div>
            <Label>Building Type</Label>
            <RadioGroup value={buildingType} onValueChange={(v) => setBuildingType(v as BuildingType)} className="grid grid-cols-2 gap-2 pt-2">
              {BUILDING_TYPES.map(b => (
                <label key={b.value} className="flex items-center gap-2 text-sm cursor-pointer rounded-md border p-2 hover:bg-muted">
                  <RadioGroupItem value={b.value} /> {b.label}
                </label>
              ))}
            </RadioGroup>
          </div>
        </Card>

        {/* ─── PUBLISH TOGGLE ─────────────────────────────────────────────── */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Visible to tenants</Label>
              <p className="text-xs text-muted-foreground">Hide while editing or once rented</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {editing ? "Save changes" : "Register Property"}
        </Button>
      </form>
    </div>
  );
}
