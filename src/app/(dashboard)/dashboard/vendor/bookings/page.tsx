import BookingRequests from "@/components/dashboard/vendor/booking-requests";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Requests",
  description: "Review and accept or reject customer booking requests.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function BookingRequestsPage() {
  return <BookingRequests />;
}
