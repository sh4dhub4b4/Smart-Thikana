import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // Or use your shadcn use-toast

import type { ServiceProvider } from "./services-api";

type Provider = Pick<ServiceProvider, "id" | "company_name" | "hourly_rate" | "experience_years" | "service_categories">;

interface ServiceBookingFlowProps {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceBookingFlow({ provider, isOpen, onClose }: ServiceBookingFlowProps) {
  const { user } = useAuth(); // Get the logged-in tenant
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");

  const handleBooking = async () => {
    if (!user) {
      toast.error("You must be logged in to book a service.");
      return;
    }
    if (!scheduledDate) {
      toast.error("Please select a preferred date.");
      return;
    }

    setIsSubmitting(true);

    // Insert a strictly 'pending' record into service_bookings
    const { error } = await supabase.from("service_bookings").insert({
      provider_id: provider?.id,
      tenant_id: user.id,
      status: "pending",
      scheduled_at: scheduledDate,
      // Note: listing_id is optional in schema, we skip it for this MVP
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("Failed to submit request. " + error.message);
    } else {
      toast.success("Booking requested successfully! The vendor will contact you.");
      onClose(); // Close the modal
    }
  };

  if (!provider) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book {provider.company_name || "Service Provider"}</DialogTitle>
          <DialogDescription>
            {provider.service_categories?.name} • {provider.experience_years} yrs exp • ৳{provider.hourly_rate}/hr
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Preferred Date & Time</Label>
            <Input 
              id="date" 
              type="datetime-local" 
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            *This is a request. No payment is required until the vendor confirms availability.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleBooking} disabled={isSubmitting}>
            {isSubmitting ? "Requesting..." : "Request Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}