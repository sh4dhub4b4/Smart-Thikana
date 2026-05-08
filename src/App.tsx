import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Ensure this matches the file name you created
import TenantLifeCycle from "./pages/TenantLifeCycle";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import TenantHome from "./pages/TenantHome";
import LandlordDashboard from "./pages/LandlordDashboard";
import MyListings from "./pages/MyListings";
import ListingForm from "./pages/ListingForm";
import ListingDetail from "./pages/ListingDetail";
import Favorites from "./pages/Favorites";
import Messages from "./pages/Messages";
import Payment from "./pages/Payment";
import Receipt from "./pages/Receipt";
import Profile from "./pages/Profile";
import Kyc from "./pages/Kyc";
import Feedback from "./pages/Feedback";
import RentalHistory from "./pages/RentalHistory";
import TenantLookup from "./pages/TenantLookup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/tenant" element={<ProtectedRoute requireRole="tenant"><TenantHome /></ProtectedRoute>} />
              <Route path="/favorites" element={<ProtectedRoute requireRole="tenant"><Favorites /></ProtectedRoute>} />
              <Route path="/landlord" element={<ProtectedRoute requireRole="landlord"><LandlordDashboard /></ProtectedRoute>} />
              <Route path="/landlord/listings" element={<ProtectedRoute requireRole="landlord"><MyListings /></ProtectedRoute>} />
              <Route path="/landlord/listings/new" element={<ProtectedRoute requireRole="landlord"><ListingForm /></ProtectedRoute>} />
              <Route path="/landlord/listings/:id/edit" element={<ProtectedRoute requireRole="landlord"><ListingForm /></ProtectedRoute>} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/payment/:agreementId" element={<ProtectedRoute requireRole="tenant"><Payment /></ProtectedRoute>} />
              <Route path="/receipt/:id" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/kyc" element={<ProtectedRoute><Kyc /></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
              {/* Tenant rental history (auto-generated from completed payments) */}
              <Route path="/history" element={<ProtectedRoute requireRole="tenant"><RentalHistory /></ProtectedRoute>} />
              {/* Landlord-only: look up & view a specific tenant's history */}
              <Route path="/history/:userId" element={<ProtectedRoute><RentalHistory /></ProtectedRoute>} />
              <Route path="/tenant-lookup" element={<ProtectedRoute requireRole="landlord"><TenantLookup /></ProtectedRoute>} />
              <Route path="/tenant/life-cycle" element={<ProtectedRoute requireRole="tenant"><TenantLifeCycle /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
