import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import type { ServiceProvider } from "./services-api";

type Provider = Pick<ServiceProvider, "id" | "user_id" | "company_name" | "hourly_rate" | "experience_years" | "service_categories">;

interface ServiceBookingFlowProps {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceBookingFlow({ provider, isOpen, onClose }: ServiceBookingFlowProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    if (!provider?.user_id) {
      toast.error("Provider information is incomplete.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Insert booking record
      const { data: booking, error: bookingError } = await supabase
        .from("service_bookings")
        .insert({
          provider_id: provider?.id,
          tenant_id: user.id,
          status: "pending",
          scheduled_at: scheduledDate,
        })
        .select("id")
        .single();

      if (bookingError) {
        toast.error("Failed to submit request. " + bookingError.message);
        return;
      }

      // 2. Find or create a conversation between tenant and provider
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("service_booking_id", booking.id)
        .limit(1)
        .maybeSingle();

      let convId = existingConv?.id;
      if (!convId) {
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            listing_id: null,
            tenant_id: user.id,
            landlord_id: provider.user_id,
            provider_id: provider.user_id,
            service_booking_id: booking.id,
          })
          .select("id")
          .single();

        if (convError) {
          toast.error("Failed to create conversation. " + convError.message);
          return;
        }
        convId = newConv.id;
      }

      // 3. Send an initial message introducing the booking
      const dateStr = new Date(scheduledDate).toLocaleDateString("en-BD", {
        dateStyle: "long",
      });
      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: convId,
        sender_id: user.id,
        content: `New service booking request for ${dateStr}. Provider: ${provider.company_name || "Service Provider"}`,
      });

      if (msgError) {
        console.error("Failed to send initial message:", msgError);
      }

      toast.success("Booking requested! Check messages to chat with the provider.");
      onClose();
      navigate(`/messages?c=${convId}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
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