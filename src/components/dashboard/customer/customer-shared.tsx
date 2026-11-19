"use client";

/**
 * WedPlan - shared pieces for the customer dashboard
 * Place at: components/dashboard/customer/customer-shared.tsx
 */

import { authClient } from "@/lib/auth-client";
import {
  ApiError,
  getMyBookings,
  type Booking,
  type BookingStatus,
} from "@/lib/bookings-api";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Ban,
  CheckCircle2,
  Clock,
  Heart,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

// session user
export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  isBlocked?: boolean;
  createdAt?: string | Date;
  phone?: string | null;
  address?: string | null;
}

export function useCustomerUser() {
  const { data, isPending, refetch } = authClient.useSession();
  return { user: data?.user as CustomerUser | undefined, isPending, refetch };
}

// bookings
export function useBookings(customerId?: string) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (signal?: AbortSignal) => {
      if (!customerId) return;

      setError(null);
      setBookings(null);

      getMyBookings(customerId, signal)
        .then(setBookings)
        .catch((e) => {
          if (e?.name === "AbortError") return;
          setError(
            e instanceof ApiError && e.status === 401
              ? "Your session expired. Please sign in again."
              : "We couldn't load your bookings.",
          );
        });
    },
    [customerId],
  );

  useEffect(() => {
    const c = new AbortController();

    void Promise.resolve().then(() => {
      if (!c.signal.aborted) load(c.signal);
    });

    return () => c.abort();
  }, [load]);

  return { bookings, setBookings, error, reload: () => load() };
}

export function countBy(list: Booking[]) {
  const c = {
    total: list.length,
    pending: 0,
    accepted: 0,
    rejected: 0,
    cancelled: 0,
  };

  for (const b of list) c[b.status]++;
  return c;
}

// status look
export const STATUS_META: Record<
  BookingStatus,
  { label: string; icon: LucideIcon; from: string; to: string; chip: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    from: "oklch(0.84 0.13 80)",
    to: "oklch(0.62 0.17 50)",
    chip: "bg-gold/25 text-foreground",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    from: "oklch(0.78 0.15 160)",
    to: "oklch(0.52 0.12 180)",
    chip: "bg-success/20 text-success",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    from: "oklch(0.72 0.19 20)",
    to: "oklch(0.5 0.22 10)",
    chip: "bg-destructive/15 text-destructive",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    from: "oklch(0.72 0.02 260)",
    to: "oklch(0.5 0.03 260)",
    chip: "bg-muted text-muted-foreground",
  },
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: BookingStatus;
  className?: string;
}) {
  const m = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${m.chip} ${className}`}
    >
      <m.icon className="h-3.5 w-3.5" /> {m.label}
    </span>
  );
}

// formatting
export function parseDate(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
}

export const formatDate = (s?: string | Date | null) =>
  s
    ? (typeof s === "string" ? parseDate(s) : s).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export function daysUntil(s: string) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((parseDate(s).getTime() - t.getTime()) / 86_400_000);
}

export const money = (n: number) => `৳${n.toLocaleString("en-US")}`;

// avatar
export function Avatar({
  src,
  name,
  size = 40,
  className = "",
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return src && failedSrc !== src ? (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      onError={() => setFailedSrc(src)}
      className={`rounded-full object-cover ${className}`}
    />
  ) : (
    <span
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`grid place-items-center rounded-full bg-linear-to-br from-(--logo-from) to-(--logo-to) font-bold text-(--logo-fg) ${className}`}
    >
      {initials || "U"}
    </span>
  );
}

// brand mark
export function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-linear-to-br from-(--logo-from) to-(--logo-to) text-(--logo-fg) shadow-lg shadow-brand/30">
        <Heart className="h-5 w-5 fill-current" />
      </span>

      <span className="font-serif text-xl font-semibold tracking-tight">
        Wed
        <span className="bg-linear-to-r from-(--logo-from) to-(--logo-to) bg-clip-text text-transparent">
          Plan
        </span>
      </span>
    </span>
  );
}

// page header
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 18 }}
      className="mb-8 flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </motion.header>
  );
}

// modal

// Counted scroll lock, so stacked dialogs can't leave the page stuck.
let locks = 0;
function lockScroll() {
  if (locks++ === 0) document.body.style.overflow = "hidden";
  return () => {
    if (--locks === 0) document.body.style.overflow = "";
  };
}

function ModalInner({
  onClose,
  label,
  children,
  busy,
  wide,
}: {
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  busy?: boolean;
  wide?: boolean;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const unlock = lockScroll();

    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && !busy && onClose();

    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [busy, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => !busy && onClose()}
      className="fixed inset-0 z-80 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        initial={
          reduce
            ? { opacity: 0 }
            : { opacity: 0, rotateX: -20, y: 50, scale: 0.94 }
        }
        animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
        exit={
          reduce
            ? { opacity: 0 }
            : { opacity: 0, rotateX: 12, y: 24, scale: 0.96 }
        }
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        style={{ transformPerspective: 1400, transformOrigin: "50% 100%" }}
        className={`relative my-auto w-full overflow-hidden rounded-4xl border border-border bg-card shadow-2xl ${wide ? "max-w-2xl" : "max-w-md"}`}
      >
        <div className="absolute inset-x-0 top-0 z-10 h-1.5 bg-linear-to-r from-(--logo-from) to-(--logo-to)" />
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          disabled={busy}
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 text-muted-foreground backdrop-blur hover:bg-brand hover:text-brand-foreground disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {children}
      </motion.div>
    </motion.div>
  );
}

export function Modal({
  open,
  ...rest
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  busy?: boolean;
  wide?: boolean;
}) {
  return <AnimatePresence>{open && <ModalInner {...rest} />}</AnimatePresence>;
}
