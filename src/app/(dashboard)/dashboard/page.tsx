import {
  ROLE_HOME,
  getServerSession,
  redirectSignedOut,
  toRole,
} from "@/lib/session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

// /dashboard sends everyone to their own dashboard (this is where Google sign-in lands too).
export default async function DashboardIndex() {
  const session = await getServerSession();

  if (!session) return redirectSignedOut("/dashboard");
  if (session.user.isBlocked) redirect("/blocked");

  redirect(ROLE_HOME[toRole(session.user.role)]);
}

// import { ROLE_HOME, getServerSession, toRole } from "@/lib/session";
// import type { Metadata } from "next";
// import { redirect } from "next/navigation";

// export const metadata: Metadata = {
//   title: "Dashboard",
//   robots: { index: false, follow: false },
// };

// // /dashboard sends everyone to their own dashboard (this is where Google sign-in lands too).
// export default async function DashboardIndex() {
//   const session = await getServerSession();
//   if (!session) redirect("/signin?redirect=%2Fdashboard");

//   redirect(ROLE_HOME[toRole((session.user as { role?: unknown }).role)]);
// }
