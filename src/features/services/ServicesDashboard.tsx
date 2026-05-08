import { useState } from "react";
import { Loader2, MapPin, Star, Wrench, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useServiceCategories, useServiceProviders } from "./services-api.ts";
// TODO: Ensure these match the hooks you created in Step 2 (services-api.ts)

export default function ServicesDashboard() {
    // Local state for category filtering. Null means "Show All".
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Fetching data via the React Query hooks from Step 2
    // const { data: categories, isLoading: loadingCategories } = useCategories();
    // const { data: providers, isLoading: loadingProviders } = useProviders(selectedCategory);

    // --- MOCK DATA FOR COMPILATION (Remove once hooks are plugged in) ---
    const loadingCategories = false;
    const loadingProviders = false;
    const categories = [
        { id: "1", name: "Plumber", icon: "wrench" },
        { id: "2", name: "Electrician", icon: "zap" },
        { id: "3", name: "Cleaner", icon: "sparkles" },
    ];
    const providers = [
        { id: "1", company_name: "Dhaka Quick Fix", hourly_rate: 500, experience_years: 5, district: "Dhaka", thana: "Gulshan" },
        { id: "2", company_name: "Pro Volt Services", hourly_rate: 600, experience_years: 8, district: "Dhaka", thana: "Banani" },
    ];
    // -------------------------------------------------------------------

    // Helper to render lucide icons dynamically based on DB string
    const renderIcon = (iconName?: string) => {
        switch (iconName?.toLowerCase()) {
            case 'wrench': return <Wrench className="w-5 h-5" />;
            case 'zap': return <Zap className="w-5 h-5" />;
            case 'sparkles': return <Sparkles className="w-5 h-5" />;
            default: return <Wrench className="w-5 h-5" />;
        }
    };

    return (
        <div className="container max-w-6xl py-8 space-y-8 animate-in fade-in duration-500">

            {/* Hero Section */}
            <section className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center space-y-4 border border-primary/10">
                <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                    Local Services Marketplace
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Find trusted local professionals for your property. From quick fixes to deep cleaning, we've got you covered.
                </p>
            </section>

            {/* Category Filters */}
            <section className="flex flex-col items-center space-y-4">
                {loadingCategories ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button
                            variant={selectedCategory === null ? "default" : "outline"}
                            onClick={() => setSelectedCategory(null)}
                            className="rounded-full"
                        >
                            All Services
                        </Button>
                        {categories?.map((cat) => (
                            <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? "default" : "outline"}
                                onClick={() => setSelectedCategory(cat.id)}
                                className="rounded-full gap-2"
                            >
                                {renderIcon(cat.icon)}
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                )}
            </section>

            {/* Provider Grid */}
            <section>
                {loadingProviders ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : providers?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No service providers found for this category.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {providers?.map((provider) => (
                            <Card key={provider.id} className="flex flex-col hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl">{provider.company_name || 'Independent Vendor'}</CardTitle>
                                        <Badge variant="secondary" className="font-semibold">
                                            ৳{provider.hourly_rate}/hr
                                        </Badge>
                                    </div>
                                    <CardDescription className="flex items-center gap-1 mt-2">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {provider.thana || 'Local'}, {provider.district || 'City'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Star className="h-4 w-4 fill-primary text-primary" />
                                        <span>{provider.experience_years} years experience</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    {/* Step 4 Integration Point: We will replace this with the Booking Dialog trigger */}
                                    <Button className="w-full" variant="default">
                                        Request Service
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

        </div>
    );
}

/*
usecase diagram
actor "Logged-in User\n(Tenant / Landlord)" as User

package "Services Marketplace (Step 3 & 4)" {
  usecase "View Services Dashboard" as ViewDash
  usecase "Filter by Category\n(Plumber, Electrician, etc.)" as FilterCat
  usecase "View Provider Cards" as ViewCards
  
  usecase "Open Booking Modal\n(Step 4 Target)" as OpenModal
  usecase "Submit Request to\nservice_bookings table" as SubmitReq
}

User --> ViewDash : Navigates to /services
ViewDash --> FilterCat : Clicks UI Buttons
ViewDash --> ViewCards : Sees available vendors

ViewCards --> OpenModal : Clicks "Request Service"
OpenModal --> SubmitReq : Fills minimal details\n& Clicks "Confirm"
*/