import { Navigate, Outlet, useLocation } from "react-router";
import { getCurrentUser } from "../lib/session";

export function ProtectedRoute() {
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
