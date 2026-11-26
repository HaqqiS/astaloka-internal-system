import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/better-auth";
import { WaitingApprovalPoller } from "./waiting-approval-client";

export default async function WaitingApprovalPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If not logged in, redirect to home
  if (!session?.user) {
    redirect("/");
  }

  // If already approved and active, redirect to dashboard or home
  if (session.user.isActive && session.user.roleGlobal !== "NONE") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-sm">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
            <svg
              className="h-8 w-8 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Waiting Approval</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Menunggu Persetujuan
          </h1>

          {/* User Info */}
          <div className="mb-6 rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Akun Anda:</p>
            <p className="font-semibold text-foreground">
              {session.user.email}
            </p>
          </div>

          {/* Message */}
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Akun Anda sedang menunggu persetujuan dari administrator.</p>
            <p>
              Silakan hubungi administrator untuk mengaktifkan akses Anda ke
              sistem internal.
            </p>
          </div>

          {/* Status Badge */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-600 dark:bg-amber-400" />
            Status: Menunggu Persetujuan
          </div>

          {/* Auto-detect polling — redirect otomatis saat admin approve */}
          <WaitingApprovalPoller />

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <form>
              <button
                type="submit"
                formAction={async () => {
                  "use server";
                  await auth.api.signOut({
                    headers: await headers(),
                  });
                  redirect("/");
                }}
                className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Log out
              </button>
            </form>

            <Link
              href="/"
              className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
