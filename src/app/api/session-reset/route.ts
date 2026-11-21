import { NextResponse, type NextRequest } from "next/server";

/**
 * Clears stale Better Auth cookies, then sends the visitor to /signin.
 * Used by lib/session.ts when a cookie exists but the server says there is no valid session, which
 * would otherwise bounce between /signin (browser thinks it is signed in) and the dashboard.
 * Only same-site paths are accepted for ?next=.
 */
export function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("next");

  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;

  const url = new URL("/signin", request.url);

  if (next) url.searchParams.set("redirect", next);

  const res = NextResponse.redirect(url);
  res.headers.set("Cache-Control", "no-store");

  for (const c of request.cookies.getAll()) {
    if (c.name.includes("better-auth")) {
      res.cookies.set(c.name, "", {
        maxAge: 0,
        path: "/",
        secure: c.name.startsWith("__Secure-"),
      });
    }
  }

  return res;
}
