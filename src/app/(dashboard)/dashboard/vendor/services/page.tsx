import MyServices from "@/components/dashboard/vendor/my-services";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Services",
  description: "View, edit, switch on or off and delete your wedding services.",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function MyServicesPage() {
  return <MyServices />;
}
