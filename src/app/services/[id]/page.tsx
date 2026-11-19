/**
 * WedPlan - /services/[id] route
 * Place at: app/services/[id]/page.tsx
 *
 * `params` is a Promise in Next.js 15+. (On Next 14 it is a plain object: `await` still works.)
 * The page itself is private: ServiceDetails sends signed-out visitors to /signin?redirect=...
 */

import ServiceDetails from "@/components/services/service-details";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Details | WedPlan",
  description:
    "View photos, pricing and vendor information, then send a booking request.",
};

export default async function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main>
      <ServiceDetails id={id} />
    </main>
  );
}
