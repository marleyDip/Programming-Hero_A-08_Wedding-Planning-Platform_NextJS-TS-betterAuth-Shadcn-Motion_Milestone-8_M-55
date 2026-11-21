"use client";

/**
 * WedPlan - Vendor dashboard layout
 * Place at: components/dashboard/vendor/vendor-shell.tsx
 * Used by: app/dashboard/vendor/layout.tsx
 *
 * Wraps the shared DashboardShell with the vendor menu. Only vendors can open it; customers and
 * admins are redirected to their own dashboards, blocked users see the blocked screen.
 * The pending-requests badge on "Booking Requests" updates from live data.
 */

import DashboardShell, {
  type NavItem,
} from "@/components/dashboard/dashboard-shell";
import {
  Boxes,
  CalendarCheck,
  Crown,
  LayoutDashboard,
  PackagePlus,
  UserCog,
} from "lucide-react";
import { isPremium, useVendorBookings, useVendorUser } from "./vendor-shared";

const NAV: NavItem[] = [
  {
    href: "/dashboard/vendor",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/vendor/services",
    label: "My Services",
    icon: Boxes,
    exact: true,
  },
  {
    href: "/dashboard/vendor/services/new",
    label: "Add Service",
    icon: PackagePlus,
  },
  {
    href: "/dashboard/vendor/bookings",
    label: "Booking Requests",
    icon: CalendarCheck,
  },
  {
    href: "/dashboard/vendor/subscription",
    label: "Subscription",
    icon: Crown,
  },
  {
    href: "/dashboard/vendor/profile",
    label: "Profile Settings",
    icon: UserCog,
  },
];

export default function VendorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useVendorUser();
  const premium = isPremium(user);
  // only load data for a real, unblocked vendor (others are redirected by the shell)
  const { bookings } = useVendorBookings(
    user?.role === "vendor" && !user.isBlocked ? user.id : undefined,
  );
  const pending = bookings?.filter((b) => b.status === "pending").length ?? 0;

  return (
    <DashboardShell
      expectedRole="vendor"
      roleLabel={premium ? "Premium Vendor" : "Vendor"}
      storeKey="wedplan-vendor-sidebar"
      nav={NAV}
      badges={{ "/dashboard/vendor/bookings": pending }}
      promo={
        premium
          ? {
              title: "You're Premium",
              text: "Unlimited services and your Premium badge are active.",
              href: "/dashboard/vendor/subscription",
              cta: "View plan",
            }
          : {
              title: "Go Premium",
              text: "Publish unlimited services and earn the Premium badge.",
              href: "/dashboard/vendor/subscription",
              cta: "See plans",
            }
      }
    >
      {children}
    </DashboardShell>
  );
}
