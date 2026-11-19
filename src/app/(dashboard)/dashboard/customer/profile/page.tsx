// app/dashboard/customer/profile/page.tsx

import ProfileSettings from "@/components/dashboard/customer/profile-settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile Settings | WedPlan" };

export default function Page() {
  return <ProfileSettings />;
}
