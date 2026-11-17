"use client";

/**
 * Place at: app/dashboard/page.tsx
 *
 * Landing point after Google login (and for the navbar "Dashboard" fallback).
 * Sends each user to the dashboard for their role.
 */

import { dashboardFor } from "@/components/auth/auth-ui";
import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirect() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) return router.replace("/signin");
    router.replace(dashboardFor((session.user as { role?: string }).role));
  }, [session, isPending, router]);

  return (
    <div className="grid min-h-screen place-items-center">
      <motion.div
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        <Heart className="h-10 w-10 fill-brand text-brand" />
      </motion.div>
    </div>
  );
}
