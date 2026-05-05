/**
 * =============================================================================
 * ProtectedRoute
 * =============================================================================
 * A wrapper component used inside the React Router tree to gate a page on:
 *   1. Being signed in (otherwise → /auth)
 *   2. Optionally, having a specific role (tenant or landlord)
 *
 * Why this exists in the FRONTEND when RLS already protects data:
 *   - RLS protects DATA at the database layer (it's the real security boundary).
 *   - This component protects UX — redirecting users to the right screens so
 *     they never see a "permission denied" toast for a route they can't use.
 *   - Defence in depth: even if this check were bypassed, the database would
 *     still refuse to return data the user shouldn't see.
 * =============================================================================
 */
import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface Props {
  children: ReactNode;
  /** If set, only users with this exact role may render the children. */
  requireRole?: AppRole;
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // ── While AuthContext is doing its first check, show a spinner ──────────
  // Without this, a logged-in user refreshing the page would briefly be
  // bounced to /auth before the session resolves.
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Not signed in → send to login, remembering where they wanted to go ──
  // `state.from` lets the Auth page bounce them back after a successful login.
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // ── Authenticated but no role yet (typical for fresh Google sign-ins) ──
  // Send to onboarding so they pick tenant vs landlord. Never bounce them
  // to a `requireRole`-protected page they can't access.
  if (!role && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // ── Wrong role → bounce to the correct dashboard for their role ─────────
  if (requireRole && role && role !== requireRole) {
    return <Navigate to={role === "landlord" ? "/landlord" : "/tenant"} replace />;
  }

  // All checks passed → render the protected page
  return <>{children}</>;
}
