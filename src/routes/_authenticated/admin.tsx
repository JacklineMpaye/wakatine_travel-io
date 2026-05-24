import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminGate });

function AdminGate() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !isAdmin) nav({ to: "/dashboard" }); }, [isAdmin, loading, nav]);
  if (loading) return <div>Loading…</div>;
  if (!isAdmin) return null;
  return <Outlet />;
}
