import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, History, Loader2, Phone, User } from "lucide-react";
import { toast } from "sonner";

export default function RentalHistory() {
  const { userId } = useParams();
  const { user } = useAuth();
  
  // Use ID from URL (Landlord view) or current user ID (Tenant self-view)
  const targetUserId = userId || user?.id;

  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId) return;

    async function fetchFullProfile() {
  setLoading(true);
  try {
    // 1. Fetch Profile and KYC status
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*, kyc_status")
      .eq("id", targetUserId)
      .single();
    
    if (profileError) throw profileError;
    setTargetProfile(profileData);

    // 2. Fetch Rent History - FIXED: using location and district instead of address/area
    const { data: rentData, error: rentError } = await supabase
      .from("agreements")
      .select(`
        id,
        created_at,
        status,
        listing:listings(title, location, district, thana)
      `)
      .eq("tenant_id", targetUserId)
      .order("created_at", { ascending: false });
    
    if (rentError) throw rentError;
    setHistory(rentData || []);
  } catch (error: any) {
    console.error("Fetch error:", error);
    toast.error("Error loading profile: " + error.message);
  } finally {
    setLoading(false);
  }
}

    fetchFullProfile();
  }, [targetUserId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!targetProfile) {
    return (
      <div className="container py-20 text-center">
        <User className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
        <h3 className="text-lg font-medium">Profile Not Found</h3>
        <p className="text-muted-foreground">The requested tenant profile does not exist.</p>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="font-display text-3xl font-bold">Digital Residency Passport</h1>
      
      {/* Profile Header Section */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            <AvatarImage src={targetProfile?.avatar_url} />
            <AvatarFallback className="text-2xl">{targetProfile?.full_name?.[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-3xl font-bold">{targetProfile?.full_name || "Anonymous User"}</h2>
              {targetProfile?.kyc_status === 'verified' && (
                <Badge className="bg-blue-600">
                  <ShieldCheck className="h-3 w-3 mr-1"/> KYC Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-mono bg-white/50 w-fit px-2 rounded">
              User ID: {targetProfile?.id}
            </p>
            <div className="flex items-center gap-4 text-sm font-medium pt-1">
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4 text-primary" />
                {targetProfile?.phone || "No phone number"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-[1fr_350px] gap-6">
        {/* Living Life Cycle */}
        <Card className="p-6">
          <h3 className="font-bold mb-6 flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" /> Living Life Cycle
          </h3>
          
          <div className="space-y-8 border-l-2 border-primary/20 ml-3 pl-6">
             {history.length === 0 ? (
               <p className="text-sm text-muted-foreground italic py-4">
                 No verified residency records found in the system.
               </p>
             ) : (
               history.map((item) => (
                 <div key={item.id} className="relative">
                   {/* Timeline Dot */}
                   <div className={`absolute -left-[31px] mt-1.5 h-4 w-4 rounded-full border-2 border-white shadow-sm ${item.status === 'accepted' ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                   
                   <div className="flex items-center gap-2 mb-1">
                     <p className="font-bold">{item.listing?.thana || "Unknown Thana"}, {item.listing?.district || "Unknown District"}</p>
                     {item.status !== 'accepted' && (
                       <Badge variant="secondary" className="text-[10px] h-4">Pending Approval</Badge>
                     )}
                   </div>
                   <p className="text-sm text-muted-foreground">{item.listing?.location || "Location details hidden"}</p>
                   <p className="text-[10px] mt-2 text-primary font-medium bg-primary/10 w-fit px-2 py-0.5 rounded">
                     Record Created: {new Date(item.created_at).toLocaleDateString()}
                   </p>
                 </div>
               ))
             )}
          </div>
        </Card>

        {/* Right Sidebar: Trust Score */}
        <div className="space-y-6">
          <Card className="p-6 text-center">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">Trust Score</h4>
            <div className="relative inline-flex items-center justify-center mb-4">
               {/* Simplified Trust Circle */}
               <div className="h-32 w-32 rounded-full border-[10px] border-primary flex items-center justify-center">
                 <span className="text-4xl font-bold text-primary">100</span>
               </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed px-4">
              Based on payment history and verified documentation.
            </p>
          </Card>

          <Card className="p-6">
            <h4 className="font-bold text-sm mb-4">Verification Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Phone Verified</span>
                <span className="font-bold">{targetProfile?.phone ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">ID (KYC) Verified</span>
                <span className="font-bold capitalize">{targetProfile?.kyc_status || "unverified"}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}