import "server-only";

/**
 * WedPlan - server-side session + role guard
 * Place at: lib/session.ts
 *
 * Used by the dashboard layouts. It asks your Better Auth server (NEXT_PUBLIC_AUTH_URL) for the session
 * with the visitor's cookies and bypasses the cookie cache, so the role and blocked flag are always fresh.
 * That works whether Better Auth runs inside this Next app or on your Express server, and it needs no
 * import of auth.ts. Editing the URL or faking a cookie can't open another role's dashboard.
 *
 * IMPORTANT: the session cookie must reach THIS Next server. If the client and the auth server are on
 * different domains the browser keeps the cookie on the auth server's domain and this guard (and
 * proxy.ts) will see everyone as signed out. See the notes sent with this file.
 * The Express API must still verify the JWT, the role and isBlocked on every protected route.
 */

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

export interface ServerUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  isBlocked?: boolean;
}
export interface ServerSession {
  user: ServerUser;
}

const AUTH_URL = (process.env.BETTER_AUTH_URL ?? "").replace(/\/$/, "");

/** One lookup per request. Fails closed: any error counts as "not signed in". */
export const getServerSession = cache(
  async (): Promise<ServerSession | null> => {
    const cookie = (await headers()).get("cookie");
    if (!AUTH_URL || !cookie) return null;
    try {
      const res = await fetch(
        `${AUTH_URL}/api/auth/get-session?disableCookieCache=true`,
        { headers: { cookie }, cache: "no-store" },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as ServerSession | null;
      return data?.user ? data : null;
    } catch {
      return null;
    }
  },
);

async function signInUrl() {
  const path = (await headers()).get("x-pathname"); // set by proxy.ts / middleware.ts
  const safe =
    path && path.startsWith("/") && !path.startsWith("//") ? path : null;
  return safe ? `/signin?redirect=${encodeURIComponent(safe)}` : "/signin";
}

/**
 * Call at the top of a dashboard layout.
 *  - no valid session           -> /signin?redirect=<page>
 *  - blocked account            -> /blocked
 *  - signed in as another role  -> that role's own dashboard
 */
export async function requireRole(expected: Role) {
  const session = await getServerSession();
  if (!session) redirect(await signInUrl());
  if (session.user.isBlocked) redirect("/blocked");
  const role = toRole(session.user.role);
  if (role !== expected) redirect(ROLE_HOME[role]);
  return session;
}
