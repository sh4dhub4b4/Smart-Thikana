import { useState } from "react";
import { Loader2, MapPin, Star, Wrench, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useServiceCategories, useServiceProviders, ServiceProvider } from "./services-api";
import { ServiceBookingFlow } from "./ServiceBookingFlow";

export default function ServicesDashboard() {
    // 1. Local state for category filtering. Null means "Show All".
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // 2. State to handle the Single-File Booking Modal
    const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    // 3. Fetching REAL data via the React Query hooks from services-api.ts
    const { data: categories, isLoading: loadingCategories } = useServiceCategories();
    const { data: providers, isLoading: loadingProviders } = useServiceProviders(selectedCategory);

    // Helper to render lucide icons dynamically based on DB string
    const renderIcon = (iconName?: string | null) => {
        switch (iconName?.toLowerCase()) {
            case 'wrench': return <Wrench className="w-5 h-5" />;
            case 'zap': return <Zap className="w-5 h-5" />;
            case 'sparkles': return <Sparkles className="w-5 h-5" />;
            default: return <Wrench className="w-5 h-5" />;
        }
    };

    // Handler to open the booking modal with the correct provider context
    const handleRequestService = (provider: ServiceProvider) => {
        setSelectedProvider(provider);
        setIsBookingModalOpen(true);
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
                                    <Button
                                        className="w-full"
                                        variant="default"
                                        onClick={() => handleRequestService(provider)}
                                    >
                                        Request Service
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* Single-File Booking Flow Integration */}
            <ServiceBookingFlow
                provider={selectedProvider}
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
            />

        </div>
    );
}
