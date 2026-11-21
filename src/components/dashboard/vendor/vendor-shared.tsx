"use client";

/**
 * WedPlan - shared pieces for the vendor dashboard
 * Place at: components/dashboard/vendor/vendor-shared.tsx
 * (re-uses Avatar, Modal, PageHeader and formatters from components/dashboard/customer/customer-shared.tsx)
 */

import type { CustomerUser } from "@/components/dashboard/customer/customer-shared";
import { authClient } from "@/lib/auth-client";
import {
  ApiError,
  FREE_LIMIT,
  getVendorBookings,
  getVendorServices,
  type ServiceStatus,
  type VendorBooking,
  type VendorService,
} from "@/lib/vendor-api";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  Camera,
  Clock,
  Crown,
  Flower2,
  LayoutGrid,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export { FREE_LIMIT };

// session user
export interface VendorUser extends CustomerUser {
  businessName?: string | null;
  subscriptionPlan?: string | null;
  subscriptionExpiresAt?: string | Date | null;
}

export function useVendorUser() {
  const { data, isPending, refetch } = authClient.useSession();
  return { user: data?.user as VendorUser | undefined, isPending, refetch };
}

/** Premium = plan is "premium" and it has not expired. */
export function isPremium(
  u?: Pick<VendorUser, "subscriptionPlan" | "subscriptionExpiresAt"> | null,
) {
  if (!u || u.subscriptionPlan !== "premium") return false;
  return (
    !u.subscriptionExpiresAt || new Date(u.subscriptionExpiresAt) > new Date()
  );
}

/** Services that count toward the Free plan limit: switched on and not rejected. */
export const countsAsActive = (s: VendorService) =>
  s.isActive && s.status !== "rejected";
export const activeCount = (list: VendorService[]) =>
  list.filter(countsAsActive).length;

// data
function useLoader<T>(
  id: string | undefined,
  fetcher: (id: string, signal: AbortSignal) => Promise<T[]>,
  what: string,
) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (signal?: AbortSignal) => {
      if (!id) return;

      const requestSignal = signal ?? new AbortController().signal;

      Promise.resolve()
        .then(() => {
          if (requestSignal.aborted) return undefined;
          setError(null);
          setData(null);
          return fetcher(id, requestSignal);
        })
        .then((result) => {
          if (result !== undefined && !requestSignal.aborted) setData(result);
        })
        .catch((e) => {
          if (e?.name === "AbortError" || requestSignal.aborted) return;
          setError(
            e instanceof ApiError && e.status === 401
              ? "Your session expired. Please sign in again."
              : `We couldn't load your ${what}.`,
          );
        });
    },
    [id, fetcher, what],
  );

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);

    return () => c.abort();
  }, [load]);

  return { data, setData, error, reload: () => load() };
}

export function useVendorServices(vendorId?: string) {
  const { data, setData, error, reload } = useLoader<VendorService>(
    vendorId,
    getVendorServices,
    "services",
  );

  return { services: data, setServices: setData, error, reload };
}

export function useVendorBookings(vendorId?: string) {
  const { data, setData, error, reload } = useLoader<VendorBooking>(
    vendorId,
    getVendorBookings,
    "booking requests",
  );

  return { bookings: data, setBookings: setData, error, reload };
}

// categories
export const CATEGORIES: {
  name: string;
  icon: LucideIcon;
  from: string;
  to: string;
}[] = [
  {
    name: "Photography & Videography",
    icon: Camera,
    from: "oklch(0.7 0.16 305)",
    to: "oklch(0.45 0.2 285)",
  },
  {
    name: "Wedding Venues",
    icon: Building2,
    from: "oklch(0.74 0.15 28)",
    to: "oklch(0.5 0.21 10)",
  },
  {
    name: "Decoration & Florist",
    icon: Flower2,
    from: "oklch(0.84 0.13 80)",
    to: "oklch(0.6 0.17 40)",
  },
  {
    name: "Catering Services",
    icon: UtensilsCrossed,
    from: "oklch(0.76 0.14 155)",
    to: "oklch(0.48 0.12 180)",
  },
  {
    name: "Makeup & Styling",
    icon: Sparkles,
    from: "oklch(0.78 0.16 350)",
    to: "oklch(0.5 0.22 335)",
  },
  {
    name: "Wedding Fashion",
    icon: Shirt,
    from: "oklch(0.72 0.19 20)",
    to: "oklch(0.46 0.2 0)",
  },
];

const FALLBACK = {
  name: "",
  icon: LayoutGrid,
  from: "oklch(0.72 0.14 230)",
  to: "oklch(0.46 0.16 255)",
};

export const categoryMeta = (name: string) =>
  CATEGORIES.find((c) => c.name === name) ?? FALLBACK;

export const CITIES = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Cox's Bazar",
];

export const PRICE_TYPES = [
  "per event",
  "per day",
  "per person",
  "per package",
];

// service status
export const SERVICE_STATUS: Record<
  ServiceStatus,
  {
    label: string;
    icon: LucideIcon;
    from: string;
    to: string;
    chip: string;
    note: string;
  }
> = {
  pending: {
    label: "Pending approval",
    icon: Clock,
    from: "oklch(0.84 0.13 80)",
    to: "oklch(0.62 0.17 50)",
    chip: "bg-gold/25 text-foreground",
    note: "Waiting for an admin to review it. Customers can't see it yet.",
  },
  approved: {
    label: "Approved",
    icon: BadgeCheck,
    from: "oklch(0.78 0.15 160)",
    to: "oklch(0.52 0.12 180)",
    chip: "bg-success/20 text-success",
    note: "Approved by an admin. Customers can see it while it is switched on.",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    from: "oklch(0.72 0.19 20)",
    to: "oklch(0.5 0.22 10)",
    chip: "bg-destructive/15 text-destructive",
    note: "Rejected by an admin, so it is hidden from customers.",
  },
};

export function ServiceStatusBadge({
  status,
  className = "",
}: {
  status: ServiceStatus;
  className?: string;
}) {
  const m = SERVICE_STATUS[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${m.chip} ${className}`}
    >
      <m.icon className="h-3.5 w-3.5" /> {m.label}
    </span>
  );
}

export function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-linear-to-r from-[oklch(0.85_0.14_85)] to-[oklch(0.72_0.15_60)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-900 shadow-md ${className}`}
    >
      <motion.span
        animate={{ rotate: [0, -12, 12, 0] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      >
        <Crown className="h-3.5 w-3.5" />
      </motion.span>
      Premium
    </span>
  );
}

// shared styles
export const fieldCls = (err?: string | false) =>
  `w-full rounded-2xl border bg-background px-4 py-3.5 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/70 focus:ring-4 ${
    err
      ? "border-destructive focus:ring-destructive/20"
      : "border-border focus:border-brand focus:ring-brand/20"
  }`;
