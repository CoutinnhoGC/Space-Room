import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { getCurrentUser } from "../lib/session";

export function PublicRoute() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    const previousColorScheme = root.style.colorScheme;

    root.classList.remove("dark");
    root.style.colorScheme = "light";

    return () => {
      if (hadDark) {
        root.classList.add("dark");
      }
      root.style.colorScheme = previousColorScheme;
    };
  }, []);

  if (getCurrentUser()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}