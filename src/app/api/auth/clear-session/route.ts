import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  "better-auth.session_data",
  "__Secure-better-auth.session_data",
] as const;

function getSafeRedirectPath(rawPath: string | null): string {
  if (
    !rawPath ||
    !rawPath.startsWith("/") ||
    rawPath.startsWith("//") ||
    rawPath.startsWith("/api/auth/clear-session")
  ) {
    return "/login";
  }
  return rawPath;
}

/**
 * Clears stale or expired Better Auth session cookies and redirects safely.
 * Used when Server Components detect an invalid/expired session cookie
 * (since Server Components cannot mutate cookies directly in Next.js App Router).
 */
export function GET(request: NextRequest) {
  const redirectPath = getSafeRedirectPath(
    request.nextUrl.searchParams.get("redirect"),
  );
  const redirectUrl = new URL(redirectPath, request.url);
  const response = NextResponse.redirect(redirectUrl);

  for (const cookieName of SESSION_COOKIE_NAMES) {
    response.cookies.set(cookieName, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: cookieName.startsWith("__Secure-"),
    });
  }

  return response;
}
