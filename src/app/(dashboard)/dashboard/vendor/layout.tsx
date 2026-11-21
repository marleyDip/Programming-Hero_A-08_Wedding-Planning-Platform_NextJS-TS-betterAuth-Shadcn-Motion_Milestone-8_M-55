import VendorShell from "@/components/dashboard/vendor/vendor-shell";
import { requireRole } from "@/lib/session";
import type { Metadata } from "next";

// Private area: keep it out of search results and give every tab a clear title.
export const metadata: Metadata = {
  title: { default: "Vendor Dashboard | WedPlan", template: "%s | WedPlan" },
  description:
    "Manage your WedPlan services, booking requests and subscription.",

  robots: { index: false, follow: false, nocache: true },
};

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("vendor"); // server-side session + role check

  return <VendorShell>{children}</VendorShell>;
}
