import VendorProfileSettings from "@/components/dashboard/vendor/profile-settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "Update your name, photo, business name and contact details.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function VendorProfilePage() {
  return <VendorProfileSettings />;
}
