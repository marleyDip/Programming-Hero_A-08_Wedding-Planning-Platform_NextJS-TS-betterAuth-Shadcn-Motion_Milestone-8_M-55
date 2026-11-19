// app/dashboard/customer/bookings/page.tsx   (Suspense: the page reads ?status=)
import MyBookings from "@/components/dashboard/customer/my-bookings";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "My Bookings | WedPlan" };

export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" aria-busy="true" />}>
      <MyBookings />
    </Suspense>
  );
}
