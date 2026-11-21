import ServiceForm from "@/components/dashboard/vendor/service-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Service",
  description: "Publish a new wedding service with a live preview.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function AddServicePage() {
  return <ServiceForm />;
}
