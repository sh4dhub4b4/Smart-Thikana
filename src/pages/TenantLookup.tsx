/**
 * TenantLookup — landlord-only utility to look up any tenant by their User
 * ID (which the tenant copies from their own profile and shares).
 *
 * Routes to /history/:userId where the rental history is rendered.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function TenantLookup() {
  const [id, setId] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = id.trim();
    
    // UUID quick sanity check
    if (!/^[0-9a-f-]{36}$/i.test(trimmed)) {
      toast.error("Please paste a valid tenant User ID");
      return;
    }

    // Prevent landlord from looking up themselves to avoid confusion
    if (trimmed === user?.id) {
      toast.error("This is your own ID. Please enter a tenant's User ID.");
      return;
    }

    // Navigate to the history route with the tenant's ID
    navigate(`/history/${trimmed}`);
  };

  return (
    <div className="container max-w-xl py-12">
      <h1 className="font-display text-3xl font-bold mb-2">Look up a tenant</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Ask the tenant to copy their User ID from their profile and paste it below to view their rental history.
      </p>
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-3">
          <Input 
            value={id} 
            onChange={(e) => setId(e.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000" 
          />
          <Button type="submit" className="w-full">
            <Search className="h-4 w-4 mr-2" /> View history
          </Button>
        </form>
      </Card>
    </div>
  );
}