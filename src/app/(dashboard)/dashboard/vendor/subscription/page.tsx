import Subscription from "@/components/dashboard/vendor/subscription";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription",
  description: "Compare the Free and Premium plans and upgrade with Stripe.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function SubscriptionPage() {
  return <Subscription />;
}
