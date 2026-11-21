import SignOutButton from "@/components/auth/sign-out-button";
import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account blocked | WedPlan",
  robots: { index: false, follow: false },
};

export default function BlockedPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-4xl border border-border bg-card p-8 text-center shadow-2xl">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </span>

        <h1 className="mt-5 font-serif text-3xl font-semibold">
          Your account is blocked
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          An administrator has blocked this account, so you can&apos;t use your
          dashboard or other protected features. If you think this is a mistake,
          please contact WedPlan support.
        </p>

        <SignOutButton />
      </div>
    </main>
  );
}
