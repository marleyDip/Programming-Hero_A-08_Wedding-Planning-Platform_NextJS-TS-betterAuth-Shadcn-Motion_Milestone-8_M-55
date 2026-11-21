"use client";

import { authClient } from "@/lib/auth-client";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    try {
      await authClient.signOut();
      router.replace("/signin");
      router.refresh();
    } catch {
      toast.error("Couldn't sign you out. Please try again.");
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/30 disabled:opacity-70"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}{" "}
      Sign out
    </button>
  );
}
