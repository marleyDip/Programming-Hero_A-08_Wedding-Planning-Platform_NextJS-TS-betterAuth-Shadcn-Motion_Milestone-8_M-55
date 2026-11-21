/**
 * WedPlan - /services/[id] route
 * Place at: app/services/[id]/page.tsx
 *
 * `params` is a Promise in Next.js 15+. (On Next 14 it is a plain object: `await` still works.)
 * The page itself is private: ServiceDetails sends signed-out visitors to /signin?redirect=...
 */

import ServiceDetails from "@/components/services/service-details";
import ServiceDetailsSkeleton from "@/components/services/service-details-skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Service Details | WedPlan",
  description:
    "View photos, pricing and vendor information, then send a booking request.",
};

type ServiceDetailsPageProps = {
  params: Promise<{ id: string }>;
};

// Server Component: keeps URL parameter access inside Suspense.
async function ServiceDetailsContent({ params }: ServiceDetailsPageProps) {
  const { id } = await params;

  return <ServiceDetails id={id} />;
}

export default function ServiceDetailsPage({
  params,
}: ServiceDetailsPageProps) {
  return (
    <main>
      <Suspense fallback={<ServiceDetailsSkeleton />}>
        <ServiceDetailsContent params={params} />
      </Suspense>
    </main>
  );
}

// export default async function ServiceDetailsPage({
//   params,
// }: {
//   params: Promise<{ id: string }>;
// }) {
//   const { id } = await params;
//   return (
//     <main>
//       <ServiceDetails id={id} />
//     </main>
//   );
// }
