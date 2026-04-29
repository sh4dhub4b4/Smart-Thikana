/**
 * MyListings — landlord's full list with edit/delete/toggle-visibility.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Listing, fmtBDT, placeholderImage } from "@/lib/listings";
import { toast } from "sonner";

export default function MyListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("listings").select("*").eq("landlord_id", user.id).order("created_at", { ascending: false });
    setListings((data as Listing[]) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Listing deleted"); load(); }
  };

  const toggleActive = async (l: Listing) => {
    const { error } = await supabase.from("listings").update({ is_active: !l.is_active }).eq("id", l.id);
    if (error) toast.error(error.message);
    else load();
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">My Listings</h1>
        <Button asChild><Link to="/landlord/listings/new"><Plus className="h-4 w-4 mr-2" /> New</Link></Button>
      </div>

      {listings.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">You haven't listed any property yet.</p>
          <Button asChild><Link to="/landlord/listings/new">Create your first listing</Link></Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listings.map(l => (
            <Card key={l.id} className="p-4 flex flex-col sm:flex-row gap-4">
              <img src={l.images?.[0] || placeholderImage(l.id)} alt={l.title}
                className="h-32 w-full sm:w-44 object-cover rounded-md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/listings/${l.id}`} className="font-display font-semibold hover:text-primary">{l.title}</Link>
                  <Badge variant={l.is_active ? "default" : "secondary"}>{l.is_active ? "Active" : "Hidden"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{l.location}</p>
                <p className="text-primary font-semibold mt-1">{fmtBDT(l.price)} <span className="text-xs text-muted-foreground">/ month</span></p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild><Link to={`/landlord/listings/${l.id}/edit`}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Link></Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(l)}>
                    {l.is_active ? <><EyeOff className="h-3.5 w-3.5 mr-1" /> Hide</> : <><Eye className="h-3.5 w-3.5 mr-1" /> Show</>}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive"><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(l.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
