"use client";

/**
 * WedPlan - Admin dashboard layout
 * Place at: components/dashboard/admin/admin-shell.tsx
 * Used by: app/dashboard/admin/layout.tsx
 *
 * Wraps the shared DashboardShell with the admin menu. Only admins can open it; customers and vendors
 * are redirected to their own dashboards and blocked users see the blocked screen. This is a UX layer:
 * the server must verify the admin role on every admin API as well.
 * The badge on "Manage Services" shows how many services are waiting for review.
 */

import DashboardShell, {
  type NavItem,
} from "@/components/dashboard/dashboard-shell";
import { LayoutDashboard, ReceiptText, Store, Users } from "lucide-react";
import { useEffect } from "react";
import { SERVICES_CHANGED, useAdminUser, useServices } from "./admin-shared";

const NAV: NavItem[] = [
  {
    href: "/dashboard/admin",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/dashboard/admin/users", label: "Manage Users", icon: Users },
  { href: "/dashboard/admin/services", label: "Manage Services", icon: Store },
  {
    href: "/dashboard/admin/transactions",
    label: "Transactions",
    icon: ReceiptText,
  },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAdminUser();
  // only load data for a real, unblocked admin (others are redirected by the shell)
  const { services, refresh } = useServices(
    user?.role === "admin" && !user.isBlocked,
  );

  useEffect(() => {
    window.addEventListener(SERVICES_CHANGED, refresh);
    return () => window.removeEventListener(SERVICES_CHANGED, refresh);
  }, [refresh]);

  const pending = services?.filter((s) => s.status === "pending").length ?? 0;

  return (
    <DashboardShell
      expectedRole="admin"
      roleLabel="Administrator"
      storeKey="wedplan-admin-sidebar"
      nav={NAV}
      badges={{ "/dashboard/admin/services": pending }}
    >
      {children}
    </DashboardShell>
  );
}
