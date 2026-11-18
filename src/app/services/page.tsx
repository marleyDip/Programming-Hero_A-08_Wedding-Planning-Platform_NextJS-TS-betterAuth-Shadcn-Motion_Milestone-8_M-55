/**
 * WedPlan - /services route
 * Place at: app/services/page.tsx
 * (Suspense is required because the explorer reads the URL query with useSearchParams.)
 */

import ServicesExplorer from "@/components/services/services-explorer";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Browse Wedding Services | WedPlan",
  description:
    "Search and filter approved wedding services by name, category and location.",
};

export default function ServicesPage() {
  return (
    <main>
      <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
        <ServicesExplorer />
      </Suspense>
    </main>
  );
}
