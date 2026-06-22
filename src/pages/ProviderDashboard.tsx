import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Wrench, Settings, MessageSquare, Clock, Loader2, Check, X } from "lucide-react";

interface BookingRow {
  id: string;
  tenant_id: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  tenant_name?: string;
}

interface ProviderProfile {
  id: string;
  company_name: string | null;
  phone: string | null;
  hourly_rate: number;
  thana: string | null;
  district: string | null;
  is_verified: boolean;
  is_approved: boolean;
  category_id: string | null;
  service_categories?: { name: string } | null;
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("service_providers")
          .select("*, service_categories(name)")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          toast.error("Failed to load provider profile");
          return;
        }
        if (!data) {
          navigate("/provider/signup", { replace: true });
          return;
        }
        setProfile(data as unknown as ProviderProfile);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user, navigate]);

  // Fetch bookings once profile is loaded
  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;

    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from("service_bookings")
        .select("id, tenant_id, status, scheduled_at, created_at")
        .eq("provider_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (cancelled) return;
      if (!error && data) {
        setBookings(data as BookingRow[]);
      }
    };

    fetchBookings();

    // Realtime: listen for new bookings
    const channel = supabase
      .channel(`provider-bookings:${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "service_bookings",
          filter: `provider_id=eq.${profile.id}`,
        },
        async (payload) => {
          if (cancelled) return;
          const newBooking = payload.new as BookingRow;
          setBookings((prev) => [newBooking, ...prev]);
          toast("New service request!", {
            description: "A customer has requested your service.",
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const handleBookingResponse = async (bookingId: string, newStatus: "accepted" | "rejected") => {
    const { error } = await supabase
      .from("service_bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to update booking. " + error.message);
      return;
    }

    // Find the conversation for this booking and send a status message
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("service_booking_id", bookingId)
      .maybeSingle();

    if (conv && user) {
      const msg = newStatus === "accepted"
        ? "Your service request has been accepted! Let's discuss the details."
        : "Your service request has been declined.";
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: user.id,
        content: msg,
      });
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );

    toast.success(`Booking ${newStatus}`);
  };

  const statusBadge = () => {
    if (!profile.is_approved) return <Badge variant="secondary">Pending Approval</Badge>;
    if (!profile.is_verified) return <Badge variant="outline">Pending Verification</Badge>;
    return <Badge className="bg-green-500">Active</Badge>;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Provider Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your services and grow your business</p>
        </div>
        {statusBadge()}
      </div>

      {/* Profile summary */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900 grid place-items-center shrink-0">
            <Wrench className="h-7 w-7 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">{profile.company_name || "Independent Provider"}</h2>
            <p className="text-sm text-muted-foreground">
              {profile.service_categories?.name || "General Services"}
              {profile.thana && profile.district && ` \u2022 ${profile.thana}, ${profile.district}`}
            </p>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link to="/messages">
          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
            <MessageSquare className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Messages</h3>
            <p className="text-sm text-muted-foreground">Chat with tenants and landlords</p>
          </Card>
        </Link>
        <Link to="/profile">
          <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full">
            <Settings className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold">Settings</h3>
            <p className="text-sm text-muted-foreground">Update your profile and preferences</p>
          </Card>
        </Link>
      </div>

      {/* My Bookings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">My Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {b.scheduled_at
                        ? new Date(b.scheduled_at).toLocaleDateString("en-BD", {
                            dateStyle: "medium",
                          })
                        : "No date set"}
                    </p>
                    <Badge
                      variant={
                        b.status === "pending"
                          ? "secondary"
                          : b.status === "accepted"
                            ? "default"
                            : "destructive"
                      }
                      className="mt-1"
                    >
                      {b.status}
                    </Badge>
                  </div>
                  {b.status === "pending" && (
                    <div className="flex gap-2 shrink-0 ml-3">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleBookingResponse(b.id, "accepted")}
                      >
                        <Check className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBookingResponse(b.id, "rejected")}
                      >
                        <X className="h-4 w-4 mr-1" /> Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status info */}
      {!profile.is_approved && (
        <Card className="p-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">Pending Review</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Your provider profile is being reviewed. You will be able to receive service requests once approved.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
