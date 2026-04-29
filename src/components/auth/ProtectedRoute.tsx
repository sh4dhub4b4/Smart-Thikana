/**
 * ProtectedRoute — gates a route by auth and (optionally) role.
 */
import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({
  children,
  requireRole,
}: { children: ReactNode; requireRole?: AppRole }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (requireRole && role !== requireRole) {
    return <Navigate to={role === "landlord" ? "/landlord" : "/tenant"} replace />;
  }
  return <>{children}</>;
}
