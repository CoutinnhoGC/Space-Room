import { Navigate, Outlet } from "react-router";
import { getCurrentUser } from "../lib/session";

export function PublicRoute() {
  if (getCurrentUser()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
