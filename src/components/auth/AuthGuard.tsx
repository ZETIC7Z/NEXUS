import { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "@/stores/auth";

interface AuthGuardProps {
  children: ReactElement;
}

/**
 * AuthGuard component - protects routes from unauthenticated access
 * Redirects to landing page if user is not logged in
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const account = useAuthStore((s) => s.account);
  const location = useLocation();
  const isLoggedIn = !!account;

  if (!isLoggedIn) {
    // Redirect to landing page, save intended destination
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
