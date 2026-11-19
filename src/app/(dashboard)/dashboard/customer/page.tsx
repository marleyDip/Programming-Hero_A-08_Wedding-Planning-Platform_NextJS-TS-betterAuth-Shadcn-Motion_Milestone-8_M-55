// app/dashboard/customer/page.tsx

import CustomerOverview from "@/components/dashboard/customer/customer-overview";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard | WedPlan" };

export const instant = false;

export default function Page() {
  return <CustomerOverview />;
}
