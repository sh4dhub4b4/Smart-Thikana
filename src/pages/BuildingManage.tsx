import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Phone, Plus, Loader2, ArrowLeft, Trash2, Wrench } from "lucide-react";

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
}

interface MaintenanceRequest {
  id: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

export default function BuildingManage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [buildingName, setBuildingName] = useState("");

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: b } = await supabase.from("buildings").select("name, owner_id").eq("id", id).single();
        if (cancelled) return;
        if (!b || b.owner_id !== user.id) {
          toast.error("You don't have permission to manage this building");
          navigate("/my-building");
          return;
        }
        setBuildingName(b.name);

        const [{ data: c }, { data: m }] = await Promise.all([
          supabase.from("emergency_contacts").select("*").eq("building_id", id),
          supabase.from("maintenance_requests").select("*").eq("building_id", id).order("created_at", { ascending: false }).limit(20),
        ]);

        if (!cancelled) {
          if (c) setContacts(c as EmergencyContact[]);
          if (m) setMaintenance(m as MaintenanceRequest[]);
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load management data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, user, navigate]);

  const addContact = async () => {
    if (!newName.trim() || !newPhone.trim()) { toast.error("Name and phone are required"); return; }
    setAdding(true);
    const { error } = await supabase.from("emergency_contacts").insert({
      building_id: id!,
      name: newName.trim(),
      role: newRole.trim() || "General",
      phone: newPhone.trim(),
    });
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    setNewName(""); setNewRole(""); setNewPhone("");
    toast.success("Contact added");
    const { data } = await supabase.from("emergency_contacts").select("*").eq("building_id", id!);
    if (data) setContacts(data as EmergencyContact[]);
  };

  const deleteContact = async (contactId: string) => {
    const { error } = await supabase.from("emergency_contacts").delete().eq("id", contactId);
    if (error) { toast.error(error.message); return; }
    setContacts(prev => prev.filter(c => c.id !== contactId));
    toast.success("Contact removed");
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      <Button variant="ghost" onClick={() => navigate("/my-building")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Building
      </Button>

      <h1 className="font-display text-2xl font-bold mb-6">Manage {buildingName}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-red-500" /> Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${c.phone}`} className="text-sm text-primary font-medium hover:underline">{c.phone}</a>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteContact(c.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="border rounded-lg p-3 space-y-2">
              <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Role (Fire/Ambulance/Security)" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
              <Input placeholder="Phone number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              <Button size="sm" onClick={addContact} disabled={adding} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Add Contact
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" /> Maintenance Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {maintenance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No maintenance requests yet.</p>
            ) : (
              maintenance.map((r) => (
                <div key={r.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{r.category}</span>
                    <Badge variant={
                      r.priority === "emergency" ? "destructive" :
                      r.priority === "high" ? "default" : "secondary"
                    } className="text-[10px]">{r.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-BD", { dateStyle: "short" })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
