import CustomerShell from "@/components/dashboard/customer/customer-shell";
import { requireRole } from "@/lib/session";
import type { Metadata } from "next";

// Private area: keep it out of search results and give every tab a clear title.
export const metadata: Metadata = {
  title: { default: "Customer Dashboard | WedPlan", template: "%s | WedPlan" },
  description: "Track your wedding service booking requests.",

  robots: { index: false, follow: false, nocache: true },
};

export default async function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("customer"); // server-side session + role check

  return <CustomerShell>{children}</CustomerShell>;
}
