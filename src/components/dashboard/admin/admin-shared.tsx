"use client";

/**
 * WedPlan - shared pieces for the admin dashboard
 * Place at: components/dashboard/admin/admin-shared.tsx
 * (re-uses Avatar, Modal, PageHeader and formatters from customer-shared, and category / service-status
 *  helpers from vendor-shared)
 */

import type { CustomerUser } from "@/components/dashboard/customer/customer-shared";
import {
  ApiError,
  getServices,
  getTransactions,
  getUsers,
  type AdminService,
  type AdminTransaction,
  type AdminUser,
  type Role,
} from "@/lib/admin-api";
import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Clock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Store,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export { fieldCls } from "@/components/dashboard/vendor/vendor-shared";

// session user
export function useAdminUser() {
  const { data, isPending } = authClient.useSession();
  return { user: data?.user as CustomerUser | undefined, isPending };
}

// data
function useList<T>(
  enabled: boolean,
  fetcher: (signal: AbortSignal) => Promise<T[]>,
  what: string,
) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (signal?: AbortSignal, silent = false) => {
      if (!enabled) return;
      setError(null);
      if (!silent) setData(null);

      fetcher(signal ?? new AbortController().signal)
        .then(setData)
        .catch((e) => {
          if (e?.name === "AbortError") return;
          if (silent) return; // keep showing the last good data
          setError(
            e instanceof ApiError && e.status === 401
              ? "Your session expired. Please sign in again."
              : e instanceof ApiError && e.status === 403
                ? "You don't have permission to view this."
                : `We couldn't load ${what}.`,
          );
        });
    },
    [enabled, fetcher, what],
  );

  useEffect(() => {
    const c = new AbortController();
    queueMicrotask(() => {
      if (!c.signal.aborted) load(c.signal);
    });

    return () => c.abort();
  }, [load]);

  return {
    data,
    setData,
    error,
    reload: () => load(),
    refresh: () => load(undefined, true),
  };
}

/** Pass `enabled=false` until you know the viewer is a real, unblocked admin. */
export function useUsers(enabled = true) {
  const { data, setData, error, reload } = useList<AdminUser>(
    enabled,
    getUsers,
    "users",
  );

  return { users: data, setUsers: setData, error, reload };
}

export function useServices(enabled = true) {
  const { data, setData, error, reload, refresh } = useList<AdminService>(
    enabled,
    getServices,
    "services",
  );

  return { services: data, setServices: setData, error, reload, refresh };
}

export function useTransactions(enabled = true) {
  const { data, setData, error, reload } = useList<AdminTransaction>(
    enabled,
    getTransactions,
    "transactions",
  );

  return { transactions: data, setTransactions: setData, error, reload };
}

/** Lets the sidebar badge (pending services) update right after a review on the Manage Services page. */
export const SERVICES_CHANGED = "wedplan:admin-services-changed";

export const notifyServicesChanged = () =>
  typeof window !== "undefined" &&
  window.dispatchEvent(new Event(SERVICES_CHANGED));

// roles
export const ROLE_META: Record<
  Role,
  {
    label: string;
    plural: string;
    icon: LucideIcon;
    chip: string;
    from: string;
    to: string;
  }
> = {
  customer: {
    label: "Customer",
    plural: "Customers",
    icon: User,
    chip: "bg-brand-soft text-brand",
    from: "oklch(0.78 0.16 350)",
    to: "oklch(0.55 0.22 335)",
  },
  vendor: {
    label: "Vendor",
    plural: "Vendors",
    icon: Store,
    chip: "bg-gold/25 text-foreground",
    from: "oklch(0.84 0.13 80)",
    to: "oklch(0.62 0.17 50)",
  },
  admin: {
    label: "Admin",
    plural: "Admins",
    icon: ShieldCheck,
    chip: "bg-foreground text-background",
    from: "oklch(0.55 0.12 270)",
    to: "oklch(0.35 0.12 285)",
  },
};

export function RoleBadge({
  role,
  className = "",
}: {
  role: Role;
  className?: string;
}) {
  const m = ROLE_META[role];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${m.chip} ${className}`}
    >
      <m.icon className="h-3.5 w-3.5" /> {m.label}
    </span>
  );
}

export function BlockedBadge({
  blocked,
  className = "",
}: {
  blocked: boolean;
  className?: string;
}) {
  return blocked ? (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-destructive ${className}`}
    >
      <Ban className="h-3.5 w-3.5" /> Blocked
    </span>
  ) : (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1.5 text-xs font-semibold text-success ${className}`}
    >
      <BadgeCheck className="h-3.5 w-3.5" /> Active
    </span>
  );
}

// transactions
export type TxTone = "success" | "pending" | "failed" | "neutral";

export function txTone(status: string): TxTone {
  const s = status.toLowerCase();

  if (["paid", "succeeded", "success", "complete", "completed"].includes(s))
    return "success";

  if (["pending", "open", "processing", "unpaid"].includes(s)) return "pending";

  if (["failed", "expired", "canceled", "cancelled", "declined"].includes(s))
    return "failed";

  return "neutral";
}

export const isPaid = (status: string) => txTone(status) === "success";

const TX_TONE: Record<TxTone, { icon: LucideIcon; chip: string }> = {
  success: { icon: BadgeCheck, chip: "bg-success/15 text-success" },
  pending: { icon: Clock, chip: "bg-gold/25 text-foreground" },
  failed: { icon: XCircle, chip: "bg-destructive/15 text-destructive" },
  neutral: { icon: RotateCcw, chip: "bg-muted text-muted-foreground" },
};

export function TxStatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const t = TX_TONE[txTone(status)];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${t.chip} ${className}`}
    >
      <t.icon className="h-3.5 w-3.5" /> {status}
    </span>
  );
}

/** `amount` is in minor units (the way Stripe stores it). Change the divisor here if your server stores major units. */
export function formatAmount(amount: number, currency: string) {
  const code = currency.toUpperCase();
  const zeroDecimal = ["JPY", "KRW", "VND"].includes(code);
  const value = zeroDecimal ? amount : amount / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${code}`;
  }
}

// loading / error UI
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-muted/70 ${className}`} />
  );
}

export function LoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="mx-auto max-w-md rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center"
    >
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </span>

      <p className="mt-4 font-serif text-xl font-semibold">
        Something went wrong
      </p>

      <p className="mt-1 text-sm text-muted-foreground">{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/30"
      >
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    </motion.div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-14 text-center"
    >
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand"
      >
        <Icon className="h-8 w-8" />
      </motion.span>

      <p className="mt-4 font-serif text-xl font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {text}
      </p>

      {children && <div className="mt-5">{children}</div>}
    </motion.div>
  );
}
