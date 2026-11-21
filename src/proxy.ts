/**
 * WedPlan - route gate (first line of defence)
 * Place at: proxy.ts   (project root, or src/ if you use a src folder)
 * Next.js 16+: this file is called proxy.ts and exports `proxy`. On Next.js 15 or older use middleware.ts instead (same code, exported as `middleware`).
 *
 * What it does
 *   - Signed-out visitors who open a private route are sent to /signin?redirect=<where they were going>.
 *   - It forwards the requested path to server components (x-pathname) so the server guards can
 *     build the same redirect.
 *
 * What it does NOT do (on purpose)
 *   - It only checks that a session cookie EXISTS. A cookie can be faked, so this is a fast, optimistic
 *     check, not security. The real checks are: (1) requireRole() in each dashboard layout
 *     (lib/session.ts, validates the session and role on the server) and (2) the JWT + role middleware
 *     on the Express API. Never rely on this file alone.
 *   - It does not bounce signed-in users away from /signin or /signup. A stale cookie would cause a
 *     redirect loop; the sign-in page already handles signed-in users.
 *
 * If you changed the Better Auth cookie name / prefix in auth.ts, pass the same values to getSessionCookie().
 */

import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!getSessionCookie(request)) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(url);
  }

  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname + search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/dashboard/:path*", // all dashboards
    "/services/:path+", // service details are private (the /services browse page stays public)
    "/payment/:path*", // payment success / cancel pages
  ],
};
