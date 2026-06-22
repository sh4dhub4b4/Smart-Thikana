/**
 * ServiceProviderSignUp — service provider onboarding flow.
 * Captures provider details: company name, phone, service category, hourly rate, service area.
 * Creates a record in service_providers table linked to the user.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Validation Schemas ────────────────────────────────────────────────────
const companyNameSchema = z.string().trim().min(2, "Company name required").max(100);
const phoneSchema = z.string().trim().regex(/^\+?88?01[3-9]\d{8}$/, "Invalid Bangladeshi phone");
const hourlyRateSchema = z.number().int().min(100, "Min ৳100/hr").max(100000, "Max ৳100,000/hr");
const thanaSchema = z.string().trim().min(2, "Thana required").max(100);
const districtSchema = z.string().trim().min(2, "District required").max(100);

interface ServiceCategory {
  id: string;
  name: string;
  icon: string | null;
}

export default function ServiceProviderSignUp() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1); // 1: Basic, 2: Location, 3: Review
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [thana, setThana] = useState("");
  const [district, setDistrict] = useState("");

  // ── Redirect guards ────────────────────────────────────────────────────
  useEffect(() => {
    // Only service_provider role can access this page
    if (role && role !== "service_provider") {
      navigate("/onboarding", { replace: true });
      return;
    }
  }, [role, navigate]);

  // ── Load service categories ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("service_categories")
          .select("*")
          .order("name");
        if (error) {
          console.error("Failed to load categories:", error);
          toast.error("Failed to load service categories");
          return;
        }
        setCategories(data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  // ── Validation helpers ────────────────────────────────────────────────
  const validateStep1 = (): boolean => {
    try {
      companyNameSchema.parse(companyName);
      phoneSchema.parse(phone);
      if (!categoryId) { toast.error("Select a service category"); return false; }
      hourlyRateSchema.parse(parseInt(hourlyRate) || 0);
      return true;
    } catch (err: any) {
      toast.error(err.message ?? "Validation error");
      return false;
    }
  };

  const validateStep2 = (): boolean => {
    try {
      thanaSchema.parse(thana);
      districtSchema.parse(district);
      return true;
    } catch (err: any) {
      toast.error(err.message ?? "Validation error");
      return false;
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleNextStep = async () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("User not found");
      return;
    }

    setSubmitting(true);
    try {
      // Insert service provider record
      const { error } = await supabase.from("service_providers").insert({
        user_id: user.id,
        category_id: categoryId,
        company_name: companyName,
        phone,
        hourly_rate: parseInt(hourlyRate) || 0,
        thana,
        district,
        is_verified: false,
        is_approved: false,
      });

      if (error) {
        console.error("Error creating service provider:", error);
        toast.error("Failed to create provider profile: " + error.message);
        return;
      }

      toast.success("Profile created! Welcome to Smart Thikana's provider network.");
      navigate("/provider", { replace: true });
    } catch (err: any) {
      console.error("Unexpected error:", err);
      toast.error(err?.message ?? "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-10 bg-gradient-soft">
      <div className="w-full max-w-xl animate-fade-in-up">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Card className="p-6 sm:p-8 shadow-lg">
          {step === 1 && (
            <>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold">Service Details</h1>
                <p className="text-sm text-muted-foreground">Tell us about your service</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="company">Company/Shop Name</Label>
                  <Input
                    id="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Ali's Plumbing Services"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number (Bangladesh)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801XXXXXXXXX or 01XXXXXXXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Service Category</Label>
                  {loadingCategories ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label htmlFor="rate">Hourly Rate (৳)</Label>
                  <Input
                    id="rate"
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="e.g., 500"
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold">Service Area</h1>
                <p className="text-sm text-muted-foreground">Where do you provide services?</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="thana">Thana/Zone</Label>
                  <Input
                    id="thana"
                    value={thana}
                    onChange={(e) => setThana(e.target.value)}
                    placeholder="e.g., Dhanmondi"
                  />
                </div>

                <div>
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g., Dhaka"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                  <strong>Note:</strong> Your location helps tenants find services nearby. Make sure it's accurate.
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold">Review Your Profile</h1>
                <p className="text-sm text-muted-foreground">Confirm your service provider details</p>
              </div>

              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company:</span>
                    <span className="font-medium">{companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">
                      {categories.find((c) => c.id === categoryId)?.name || "Loading..."}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-medium">৳{hourlyRate}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{thana}, {district}</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                  <strong>Verification:</strong> Your profile will be reviewed by our team. We'll contact you within 24 hours.
                </div>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={handlePrevStep} disabled={submitting} className="flex-1">
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNextStep} disabled={submitting} className="flex-1 gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Setup
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
