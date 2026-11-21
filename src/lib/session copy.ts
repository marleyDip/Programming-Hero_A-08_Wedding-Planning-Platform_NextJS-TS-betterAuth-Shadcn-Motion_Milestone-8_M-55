import "server-only";

/**
 * WedPlan - server-side session + role guard
 * Place at: lib/session.ts
 *
 * Used by the dashboard layouts. Unlike the cookie check in proxy.ts / middleware.ts, this VALIDATES the
 * session with Better Auth on the server and reads the role from the database, so editing the URL or
 * faking a cookie can't open another role's dashboard. The Express API must still verify the JWT and
 * role on every protected route.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export type Role = "customer" | "vendor" | "admin";

export const ROLE_HOME: Record<Role, string> = {
  customer: "/dashboard/customer",
  vendor: "/dashboard/vendor",
  admin: "/dashboard/admin",
};

export const toRole = (r: unknown): Role =>
  r === "admin" || r === "vendor" ? r : "customer";

/** One session lookup per request. `disableCookieCache` makes role / blocked changes apply immediately. */
export const getServerSession = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  }),
);

async function signInUrl() {
  const path = (await headers()).get("x-pathname"); // set by proxy.ts / middleware.ts

  const safe =
    path && path.startsWith("/") && !path.startsWith("//") ? path : null;

  return safe ? `/signin?redirect=${encodeURIComponent(safe)}` : "/signin";
}

/**
 * Call at the top of a dashboard layout.
 *  - no valid session      -> /signin?redirect=<page>
 *  - signed in as another role -> that role's own dashboard
 * Blocked users are let through to the dashboard shell, which shows the "account blocked" screen and
 * never renders the page. Their API calls are rejected by the server anyway.
 */
export async function requireRole(expected: Role) {
  const session = await getServerSession();
  if (!session) redirect(await signInUrl());

  const role = toRole((session.user as { role?: unknown }).role);

  if (role !== expected) redirect(ROLE_HOME[role]);
  return session;
}

// import "server-only";

// /**
//  * WedPlan - server-side session + role guard
//  * Place at: lib/session.ts   (imports your Better Auth instance from lib/auth.ts)
//  *
//  * Used by the dashboard layouts. Better Auth runs inside this Next app, so the session is read directly
//  * with auth.api.getSession (no HTTP call, no extra env var) and the cookie cache is bypassed, so the role
//  * and blocked flag are always fresh. Editing the URL or faking a cookie can't open another role's
//  * dashboard. The Express API must still verify the JWT, the role and isBlocked on every protected route.
//  */

// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";
// import { redirect } from "next/navigation";
// import { cache } from "react";

// export type Role = "customer" | "vendor" | "admin";

// export const ROLE_HOME: Record<Role, string> = {
//   customer: "/dashboard/customer",
//   vendor: "/dashboard/vendor",
//   admin: "/dashboard/admin",
// };

// export const toRole = (r: unknown): Role =>
//   r === "admin" || r === "vendor" ? r : "customer";

// export interface ServerUser {
//   id: string;
//   name: string;
//   email: string;
//   role?: string;
//   isBlocked?: boolean;
// }
// export interface ServerSession {
//   user: ServerUser;
// }

// /**
//  * One lookup per request. A real "no session" returns null. A failure (for example the database is
//  * down) is NOT swallowed: it surfaces as an error page instead of silently signing people out.
//  */
// export const getServerSession = cache(
//   async (): Promise<ServerSession | null> => {
//     const session = await auth.api.getSession({
//       headers: await headers(),
//       query: { disableCookieCache: true },
//     });
//     return session?.user ? (session as unknown as ServerSession) : null;
//   },
// );

// const safePath = (p: string | null) =>
//   p && p.startsWith("/") && !p.startsWith("//") ? p : null;

// /**
//  * Where to send a visitor whose session isn't valid.
//  * If a session cookie is still present it is stale (expired, deleted, or the user was blocked), and the
//  * browser's cached session would send them straight back here: a redirect loop. So we go through
//  * /api/session-reset, which clears the stale cookies first and then lands on /signin.
//  */
// async function signedOutUrl() {
//   const h = await headers();
//   const path = safePath(h.get("x-pathname")); // set by proxy.ts / middleware.ts
//   const stale = (h.get("cookie") ?? "").includes("better-auth");
//   if (stale)
//     return `/api/session-reset${path ? `?next=${encodeURIComponent(path)}` : ""}`;
//   return path ? `/signin?redirect=${encodeURIComponent(path)}` : "/signin";
// }

// /**
//  * Call at the top of a dashboard layout.
//  *  - no valid session           -> /signin?redirect=<page>   (stale cookies cleared first)
//  *  - blocked account            -> /blocked
//  *  - signed in as another role  -> that role's own dashboard
//  */
// export async function requireRole(expected: Role) {
//   const session = await getServerSession();
//   if (!session) redirect(await signedOutUrl());
//   if (session.user.isBlocked) redirect("/blocked");
//   const role = toRole(session.user.role);
//   if (role !== expected) redirect(ROLE_HOME[role]);
//   return session;
// }
