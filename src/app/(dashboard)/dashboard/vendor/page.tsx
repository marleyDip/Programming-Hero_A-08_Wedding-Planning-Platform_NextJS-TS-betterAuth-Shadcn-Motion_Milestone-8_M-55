import VendorOverview from "@/components/dashboard/vendor/vendor-overview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendor Overview",
  description: "Your services, booking requests and plan at a glance.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function VendorOverviewPage() {
  return <VendorOverview />;
}
