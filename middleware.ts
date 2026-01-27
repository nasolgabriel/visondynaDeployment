// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";

const roleAccessMap = {
  ADMIN: ["/admin/dashboard", "/admin/jobs", "/admin/users"],
  HR: [
    "/hr/dashboard",
    // "/hr/announcements", Adjustment requested by clients
    "/hr/jobs",
    "/hr/messages",
    "/hr/applications",
  ],
  APPLICANT: [
    "/feed",
    "/jobs",
    "/messages",
    "/notifications",
    "/onboarding",
    "/profile",
    "/settings",
  ],
} as const;

type Role = keyof typeof roleAccessMap;

function doesRoleHaveAccessToURL(role: Role, pathname: string) {
  const prefixes = roleAccessMap[role] ?? [];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;

    // ⛔ Just in case this middleware ever runs on auth pages in future,
    // bail out immediately so we never loop signin <-> middleware
    if (pathname.startsWith("/auth/") || pathname === "/") {
      return NextResponse.next();
    }

    const token = req.nextauth?.token as {
      role?: string;
      emailVerified?: unknown;
      profileCompleted?: unknown;
      sub?: string;
      user?: { id?: string };
      id?: string;
    } | null;

    // If no token, withAuth will already redirect to /auth/signin using pages.signIn
    if (!token) return NextResponse.next();

    // Normalize role
    const role = (String(token.role ?? "").toUpperCase() || undefined) as
      | Role
      | undefined;

    // Unknown / missing role -> 403 page
    if (!role || !(role in roleAccessMap)) {
      return NextResponse.rewrite(new URL("/403", req.url));
    }

    // RBAC: only allow the role’s URL prefixes
    const hasAccess = doesRoleHaveAccessToURL(role, pathname);
    if (!hasAccess) {
      return NextResponse.rewrite(new URL("/403", req.url));
    }

    // Email verification gate (but NEVER redirect away from verify page)
    const emailVerified = Boolean(token?.emailVerified);
    if (!emailVerified) {
      // Only protected routes come here (based on matcher), so it’s safe to send to verify
      const url = req.nextUrl.clone();
      url.pathname = "/auth/verify-email";
      url.searchParams.set("checkInbox", "1");
      return NextResponse.redirect(url);
    }

    // From here on, user is authenticated + verified
    if (role !== "APPLICANT") {
      // HR / Admin skip onboarding logic
      return NextResponse.next();
    }

    // Applicant onboarding gate
    const cookieVal = req.cookies.get("vd_profileCompleted")?.value;
    let cookieCompleted = false;

    if (cookieVal) {
      const userId =
        (token.sub as string) ||
        (token.user && (token.user.id as string)) ||
        (token.id as string) ||
        null;

      if (userId) {
        cookieCompleted = cookieVal === userId;
      }
    }

    const profileCompleted =
      Boolean(token?.profileCompleted) || cookieCompleted;

    const isOnboarding = pathname.startsWith("/onboarding");

    // Not completed -> force /onboarding
    if (!profileCompleted && !isOnboarding) {
      const url = req.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // Completed but still on onboarding -> send to feed
    if (profileCompleted && isOnboarding) {
      const url = req.nextUrl.clone();
      url.pathname = "/feed";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // withAuth will redirect to /auth/signin when this returns false
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  },
);

export const config = {
  matcher: [
    "/feed",
    "/jobs/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/hr/:path*",
    "/admin/:path*",
  ],
};
