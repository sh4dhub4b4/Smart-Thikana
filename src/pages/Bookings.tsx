import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Calendar, MessageSquare, Loader2, X } from "lucide-react";

interface ClientBooking {
  id: string;
  provider_name: string | null;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  conversation_id: string | null;
}

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("service_bookings")
          .select("id, status, scheduled_at, created_at")
          .eq("tenant_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (cancelled) return;
        if (error) {
          toast.error("Failed to load bookings");
          return;
        }

        const rows: ClientBooking[] = [];

        for (const b of data || []) {
          const { data: conv } = await supabase
            .from("conversations")
            .select("id")
            .eq("service_booking_id", b.id)
            .maybeSingle();

          rows.push({
            id: b.id,
            provider_name: null,
            status: b.status,
            scheduled_at: b.scheduled_at,
            created_at: b.created_at,
            conversation_id: conv?.id ?? null,
          });
        }

        setBookings(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    const { error } = await supabase
      .from("service_bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to cancel. " + error.message);
      return;
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
    );
    toast.success("Booking cancelled");
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
      <h1 className="font-display text-2xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No bookings yet.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/services")}
            >
              Browse Services
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          b.status === "pending"
                            ? "secondary"
                            : b.status === "accepted"
                              ? "default"
                              : b.status === "cancelled"
                                ? "outline"
                                : "destructive"
                        }
                      >
                        {b.status}
                      </Badge>
                    </div>
                    {b.scheduled_at && (
                      <p className="text-sm font-medium">
                        {new Date(b.scheduled_at).toLocaleDateString("en-BD", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Requested{" "}
                      {new Date(b.created_at).toLocaleDateString("en-BD", {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {b.conversation_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/messages?c=${b.conversation_id}`)
                        }
                      >
                        <MessageSquare className="h-4 w-4 mr-1" /> Chat
                      </Button>
                    )}
                    {b.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(b.id)}
                      >
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
