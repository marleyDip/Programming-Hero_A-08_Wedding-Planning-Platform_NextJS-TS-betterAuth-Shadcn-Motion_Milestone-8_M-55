import ServiceForm from "@/components/dashboard/vendor/service-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Service",
  description: "Update your wedding service details and photos.",
  robots: { index: false, follow: false },
};

export const instant = false;

// In Next.js 15+ `params` is a Promise.
export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServiceForm serviceId={id} />;
}
