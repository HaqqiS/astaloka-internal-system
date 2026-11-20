import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionAccess } from "~/lib/auth-guards";
import { getSession } from "~/server/better-auth/server";

/**
 * Check if the incoming request carries a Better Auth session cookie.
 */
export async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(
    cookieStore.get("better-auth.session_token")?.value ||
      cookieStore.get("__Secure-better-auth.session_token")?.value,
  );
}

/**
 * Server-side page protection helper
 * Use this in page.tsx to validate session and redirect if needed.
 * Automatically clears stale/expired session cookies via /api/auth/clear-session.
 */
export async function requireAuth() {
  const session = await getSession();
  const validation = validateSessionAccess(session);

  if (!validation.isValid) {
    if (validation.reason === "no_session" && (await hasSessionCookie())) {
      redirect("/api/auth/clear-session?redirect=/login");
    }
    redirect(validation.redirectTo ?? "/");
  }

  return session;
}

/**
 * Require admin access
 * Use this in admin pages
 */
export async function requireAdmin() {
  const session = await requireAuth();

  const role = session?.user?.roleGlobal;
  if (role !== "ADMIN" && role !== "EXECUTIVE") {
    redirect("/unauthorized");
  }

  return session;
}
