import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";

export default function NewBuilding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) { toast.error("Building name is required"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("buildings").insert({
      name: name.trim(),
      owner_id: user.id,
      district: district.trim() || null,
      thana: thana.trim() || null,
      total_floors: totalFloors ? parseInt(totalFloors) : null,
    }).select("id").single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Building registered!");
    navigate(`/buildings/${data.id}/manage`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-lg mx-auto animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Register Your Building
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Building Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Shyamoli Tower" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thana">Thana</Label>
              <Input id="thana" value={thana} onChange={(e) => setThana(e.target.value)} placeholder="e.g. Mirpur" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input id="district" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Dhaka" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floors">Total Floors</Label>
              <Input id="floors" type="number" min="1" value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting || !name.trim()} className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Register Building
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
