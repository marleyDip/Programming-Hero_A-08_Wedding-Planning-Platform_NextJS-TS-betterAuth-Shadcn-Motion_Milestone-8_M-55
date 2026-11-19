"use client";

import { dashboardFor } from "@/components/auth/auth-ui";
import { LogoMark } from "@/components/shared/logo";
import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRedirectClient() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      router.replace("/signin");
      return;
    }

    const role = (session.user as { role?: string }).role;

    router.replace(dashboardFor(role));
  }, [session, isPending, router]);

  return (
    <div className="grid min-h-screen place-items-center">
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <LogoMark size={56} />
      </motion.div>
    </div>
  );
}

/* <div className="grid min-h-screen place-items-center">
      <motion.div
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        <Heart className="h-10 w-10 fill-brand text-brand" />
      </motion.div>
    </div>

*/
