import AdminShell from "@/components/dashboard/admin/admin-shell";
import { requireRole } from "@/lib/session";
import type { Metadata } from "next";

// Private area: keep it out of search results and give every tab a clear title.
export const metadata: Metadata = {
  title: { default: "Admin Dashboard | WedPlan", template: "%s | WedPlan" },
  description: "Manage WedPlan users, services and transactions.",

  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin"); // server-side session + role check

  return <AdminShell>{children}</AdminShell>;
}
