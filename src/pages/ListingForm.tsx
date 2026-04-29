/**
 * ListingForm — create or edit a listing. Images are stored as
 * comma-separated URLs (lightweight; no storage bucket dependency).
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PROPERTY_TYPES, PropertyType } from "@/lib/listings";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().trim().min(3, "Title too short").max(120),
  location: z.string().trim().min(2).max(200),
  description: z.string().max(2000).default(""),
  price: z.number().positive("Price must be > 0").max(10_000_000),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  area_sqft: z.number().int().min(0).max(100000).nullable(),
});

export default function ListingForm() {
  const { id } = useParams<{ id: string }>();
  const editing = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(15000);
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [area, setArea] = useState<number | "">("");
  const [imagesText, setImagesText] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    (async () => {
      const { data } = await supabase.from("listings").select("*").eq("id", id!).maybeSingle();
      if (data) {
        setTitle(data.title); setLocation(data.location); setDescription(data.description ?? "");
        setPrice(Number(data.price)); setPropertyType(data.property_type);
        setBedrooms(data.bedrooms); setBathrooms(data.bathrooms);
        setArea(data.area_sqft ?? ""); setImagesText((data.images ?? []).join("\n"));
        setActive(data.is_active);
      }
    })();
  }, [id, editing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      title, location, description,
      price: Number(price), bedrooms: Number(bedrooms), bathrooms: Number(bathrooms),
      area_sqft: area === "" ? null : Number(area),
    });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }

    const images = imagesText.split(/\n+/).map(s => s.trim()).filter(Boolean).slice(0, 10);
    const payload = { ...parsed.data, property_type: propertyType, images, is_active: active, landlord_id: user.id };
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
    <div className="container max-w-2xl py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
      <Card className="p-6">
        <h1 className="font-display text-2xl font-bold mb-6">{editing ? "Edit Listing" : "Create Listing"}</h1>
        <form onSubmit={submit} className="space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Cozy 2BHK in Gulshan" /></div>
          <div><Label>Location</Label><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Gulshan-2, Dhaka" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Monthly price (BDT)</Label><Input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} /></div>
            <div>
              <Label>Property type</Label>
              <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Bedrooms</Label><Input type="number" value={bedrooms} onChange={e => setBedrooms(Number(e.target.value))} /></div>
            <div><Label>Bathrooms</Label><Input type="number" value={bathrooms} onChange={e => setBathrooms(Number(e.target.value))} /></div>
            <div><Label>Area (sqft)</Label><Input type="number" value={area} onChange={e => setArea(e.target.value === "" ? "" : Number(e.target.value))} /></div>
          </div>
          <div><Label>Description</Label><Textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the property, amenities, neighborhood..." /></div>
          <div>
            <Label>Image URLs (one per line, up to 10)</Label>
            <Textarea rows={3} value={imagesText} onChange={e => setImagesText(e.target.value)}
              placeholder="https://images.unsplash.com/...&#10;https://..." />
            <p className="text-xs text-muted-foreground mt-1">Tip: paste links from Unsplash or your own host.</p>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div><Label className="font-medium">Visible to tenants</Label><p className="text-xs text-muted-foreground">Hide while editing or once rented</p></div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editing ? "Save changes" : "Create listing"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
