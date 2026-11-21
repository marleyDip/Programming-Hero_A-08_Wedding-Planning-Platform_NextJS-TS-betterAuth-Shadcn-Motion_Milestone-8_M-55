"use client";

/**
 * WedPlan themed toaster (Sonner)
 * Place at: components/ui/toaster.tsx   ->   <AppToaster /> in app/layout.tsx
 *
 * Uses the CSS variables from globals.css (--brand, --gold, --success,
 * --destructive, --popover, --border, --logo-from/--logo-to ...), so it
 * automatically follows light/dark mode and any colour change you make there.
 *
 * Each toast type just sets one variable, --toast-accent; everything else
 * (border, gradient, glow, icon chip, left bar) is derived from it.
 */

import {
  CircleCheck,
  CircleX,
  Info,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export default function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      closeButton
      gap={12}
      icons={{
        loading: <LoaderCircle size={18} className="animate-spin" />,
        success: <CircleCheck size={18} />,
        error: <CircleX size={18} />,
        warning: <TriangleAlert size={18} />,
        info: <Info size={18} />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group relative overflow-hidden !border !border-[color-mix(in_oklab,var(--toast-accent)_30%,var(--border))] !bg-[linear-gradient(135deg,color-mix(in_oklab,var(--toast-accent)_13%,var(--popover)),var(--popover))] !text-foreground !backdrop-blur-2xl !shadow-[0_16px_48px_-12px_color-mix(in_oklab,var(--toast-accent)_38%,transparent)] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--toast-accent)]",

          /* One accent colour per type, taken from your theme */
          default: "[--toast-accent:var(--brand)]",
          loading: "[--toast-accent:var(--brand)] before:animate-pulse",
          success: "[--toast-accent:var(--success)]",
          error: "[--toast-accent:var(--destructive)]",
          warning: "[--toast-accent:var(--gold)]",
          info: "[--toast-accent:oklch(0.7_0.13_235)]",

          icon: "!mr-1 !grid !size-9 !place-content-center !place-items-center !rounded-xl !border !border-[color-mix(in_oklab,var(--toast-accent)_28%,transparent)] !bg-[color-mix(in_oklab,var(--toast-accent)_13%,transparent)] !text-[var(--toast-accent)]",

          title: "!text-sm !font-semibold !tracking-tight !text-foreground",

          description: "!text-xs !leading-5 !text-muted-foreground",

          closeButton:
            "!left-auto !right-2 !top-2 !size-6 !transform-none rounded-full! !border !border-border !bg-card !text-muted-foreground !opacity-100 !backdrop-blur-md !transition-all !duration-200 hover:!scale-110 hover:!bg-accent hover:!text-foreground active:!scale-95",

          actionButton:
            "!h-8 !rounded-lg !bg-[linear-gradient(90deg,var(--logo-from),var(--logo-to))] !px-3 !text-xs !font-semibold !text-(--logo-fg) !shadow-md !transition-all !duration-200 hover:!-translate-y-0.5 active:!translate-y-0 active:!scale-95",

          cancelButton:
            "!h-8 !rounded-lg !border !border-border !bg-secondary !px-3 !text-xs !font-medium !text-secondary-foreground !transition-all !duration-200 hover:!bg-accent active:!scale-95",
        },

        style: {
          borderRadius: "18px",
          padding: "14px 40px 14px 18px",
        },
      }}
    />
  );
}
