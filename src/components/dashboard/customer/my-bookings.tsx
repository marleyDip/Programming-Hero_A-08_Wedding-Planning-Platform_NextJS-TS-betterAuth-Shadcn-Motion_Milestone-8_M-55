"use client";

/**
 * WedPlan - Customer "My Bookings"
 * Place at: components/dashboard/customer/my-bookings.tsx
 * Used by: app/dashboard/customer/bookings/page.tsx (wrap in <Suspense>: it reads ?status=)
 *
 * Shows: service name + image, vendor info, event date, event location, status, request date.
 * Actions: View Details (dialog with timeline) and Cancel (PENDING requests only, with confirmation).
 * Rules: accepted / rejected / cancelled requests cannot be cancelled; other customers' bookings
 * are never shown or touched. The server must enforce both rules too.
 */

import { useTilt } from "@/components/home/section-kit";
import FancySelect, { type SelectOption } from "@/components/ui/fancy-select";
import {
  ApiError,
  cancelBooking,
  type Booking,
  type BookingStatus,
} from "@/lib/bookings-api";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpDown,
  ArrowUpRight,
  CalendarDays,
  Check,
  Eye,
  Inbox,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  SearchX,
  Store,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Avatar,
  Modal,
  PageHeader,
  STATUS_META,
  StatusBadge,
  countBy,
  formatDate,
  money,
  parseDate,
  useBookings,
  useCustomerUser,
} from "./customer-shared";

type Filter = "all" | BookingStatus;
type Sort = "newest" | "soonest" | "latest";

const SORTS: SelectOption[] = [
  { value: "newest", label: "Newest requests" },
  { value: "soonest", label: "Event date: soonest" },
  { value: "latest", label: "Event date: latest" },
];

// timeline
function Timeline({ b }: { b: Booking }) {
  const outcome =
    b.status === "accepted"
      ? "Accepted by vendor"
      : b.status === "rejected"
        ? "Rejected by vendor"
        : b.status === "cancelled"
          ? "Cancelled by you"
          : "Waiting for vendor reply";

  const steps: {
    label: string;
    when: string;
    done: boolean;
    status: BookingStatus;
  }[] = [
    {
      label: "Request sent",
      when: formatDate(b.createdAt),
      done: true,
      status: "accepted" as BookingStatus,
    },
    {
      label: outcome,
      when:
        b.status === "cancelled"
          ? formatDate(b.cancelledAt)
          : b.status === "pending"
            ? "In review"
            : "",
      done: b.status !== "pending",
      status: b.status === "pending" ? "pending" : b.status,
    },
  ];

  return (
    <ol className="relative space-y-5 pl-9">
      <span
        aria-hidden
        className="absolute bottom-3 left-3.25 top-3 w-0.5 bg-border"
      />

      {steps.map((s, i) => {
        const m = STATUS_META[s.status];

        return (
          <motion.li
            key={s.label}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.12 }}
            className="relative"
          >
            <span
              className="absolute -left-9 top-0 grid h-7 w-7 place-items-center rounded-full text-white shadow-md"
              style={{
                background: `linear-gradient(145deg, ${m.from}, ${m.to})`,
              }}
            >
              {s.done ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <motion.span
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="h-2 w-2 rounded-full bg-white"
                />
              )}
            </span>

            <p className="text-sm font-semibold">{s.label}</p>

            {s.when && (
              <p className="text-xs text-muted-foreground">{s.when}</p>
            )}
          </motion.li>
        );
      })}
    </ol>
  );
}

// details dialog
function Info({
  icon: Icon,
  k,
  v,
}: {
  icon: typeof MapPin;
  k: string;
  v: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-3.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {k}
        </p>
        <p className="wrap-break-word text-sm font-semibold">{v}</p>
      </div>
    </div>
  );
}

function DetailsDialog({
  b,
  onClose,
  onCancel,
}: {
  b: Booking | null;
  onClose: () => void;
  onCancel: (b: Booking) => void;
}) {
  const [last, setLast] = useState<Booking | null>(null);
  const cur = b ?? last;
  if (b && b !== last) setLast(b);

  return (
    <Modal open={!!b} onClose={onClose} label="Booking details" wide>
      {cur && (
        <div>
          <div className="relative h-44 overflow-hidden bg-muted">
            {cur.service?.image && (
              <Image
                src={cur.service.image}
                alt={cur.service.name ?? "Service image"}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
              />
            )}

            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />

            <div className="absolute inset-x-6 bottom-4 flex items-end justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/75">
                  {cur.service?.category ?? "Service"}
                </p>
                <h2 className="truncate font-serif text-2xl font-semibold">
                  {cur.service?.name ?? "Service no longer available"}
                </h2>
              </div>

              <StatusBadge
                status={cur.status}
                className="shrink-0 bg-white/95! text-neutral-900!"
              />
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-[1.2fr_1fr] sm:p-8">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info
                  icon={CalendarDays}
                  k="Event date"
                  v={formatDate(cur.eventDate)}
                />

                <Info
                  icon={CalendarDays}
                  k="Requested on"
                  v={formatDate(cur.createdAt)}
                />
              </div>

              <Info icon={MapPin} k="Event location" v={cur.eventLocation} />

              <Info
                icon={MessageSquare}
                k="Your message"
                v={cur.message || "No message added."}
              />

              {cur.service && (
                <Info
                  icon={ArrowUpRight}
                  k="Service price"
                  v={`${money(cur.service.price)} ${cur.service.priceType}`}
                />
              )}
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-2xl border border-border p-3.5">
                <Avatar
                  src={cur.vendor?.image}
                  name={cur.vendor?.businessName ?? "Vendor"}
                  size={46}
                />

                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Vendor
                  </p>
                  <p className="truncate text-sm font-semibold">
                    {cur.vendor?.businessName ?? "Unavailable"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {cur.vendor?.name}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status timeline
                </p>
                <Timeline b={cur} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4 sm:px-8">
            {cur.service && (
              <Link
                href={`/services/${cur.service.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-brand/50 hover:bg-brand-soft"
              >
                <Store className="h-4 w-4" /> View service
              </Link>
            )}

            {cur.status === "pending" && (
              <button
                type="button"
                onClick={() => onCancel(cur)}
                className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive hover:text-white"
              >
                <XCircle className="h-4 w-4" /> Cancel request
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// cancel dialog
function CancelDialog({
  b,
  busy,
  onClose,
  onConfirm,
}: {
  b: Booking | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [last, setLast] = useState<Booking | null>(null);
  const cur = b ?? last;
  if (b && b !== last) setLast(b);

  return (
    <Modal
      open={!!b}
      onClose={onClose}
      label="Cancel booking request"
      busy={busy}
    >
      {cur && (
        <div className="p-7 text-center sm:p-9">
          <motion.span
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive"
          >
            <XCircle className="h-8 w-8" />
          </motion.span>

          <h2 className="mt-5 font-serif text-2xl font-semibold">
            Cancel this request?
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your request for{" "}
            <b className="text-foreground">
              {cur.service?.name ?? "this service"}
            </b>{" "}
            on <b className="text-foreground">{formatDate(cur.eventDate)}</b>{" "}
            will be cancelled. You can send a new request later.
          </p>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent disabled:opacity-50"
            >
              Keep request
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-destructive/30 disabled:opacity-80"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Cancelling…
                </>
              ) : (
                "Yes, cancel request"
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// card
function BookingCard({
  b,
  index,
  onView,
  onCancel,
}: {
  b: Booking;
  index: number;
  onView: () => void;
  onCancel: () => void;
}) {
  const { ref, reduce, style, glare, handlers } = useTilt(6, 16);
  const [imgOk, setImgOk] = useState(true);
  const m = STATUS_META[b.status];

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.92, transition: { duration: 0.16 } }
      }
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 18,
        delay: Math.min(index, 6) * 0.05,
      }}
      className="perspective-distant"
    >
      <motion.article
        ref={ref}
        {...handlers}
        whileHover={reduce ? undefined : { y: -6 }}
        style={style}
        className="group relative h-full overflow-visible rounded-3xl border border-border bg-card shadow-lg transition-shadow duration-500 hover:shadow-2xl hover:shadow-brand/15"
      >
        <div className="relative aspect-16/8 overflow-hidden rounded-t-3xl bg-muted">
          {imgOk && b.service?.image ? (
            <Image
              src={b.service.image}
              alt={b.service.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={() => setImgOk(false)}
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div
              className="grid h-full place-items-center text-white"
              style={{
                background: `linear-gradient(135deg, ${m.from}, ${m.to})`,
              }}
            >
              <Inbox className="h-10 w-10 opacity-80" />
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />

          <motion.div
            aria-hidden
            style={{ background: glare }}
            className="absolute inset-0 mix-blend-soft-light"
          />
        </div>

        <span
          className="absolute right-4 top-4"
          style={{ transform: "translateZ(50px)" }}
        >
          <StatusBadge
            status={b.status}
            className="shadow-lg ring-2 ring-card"
          />
        </span>

        <div className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {b.service?.category ?? "Service"}
          </p>
          <h3
            className="mt-0.5 line-clamp-1 font-serif text-lg font-semibold"
            style={{ transform: "translateZ(24px)" }}
          >
            {b.service?.name ?? "Service no longer available"}
          </h3>

          <div className="mt-3 flex items-center gap-2.5">
            <Avatar
              src={b.vendor?.image}
              name={b.vendor?.businessName ?? "Vendor"}
              size={30}
            />
            <p className="truncate text-sm text-muted-foreground">
              by{" "}
              <span className="font-semibold text-foreground">
                {b.vendor?.businessName ?? "Unavailable"}
              </span>
            </p>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-brand" /> Event date
              </dt>
              <dd className="mt-0.5 font-semibold">
                {formatDate(b.eventDate)}
              </dd>
            </div>

            <div>
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-brand" /> Requested
              </dt>
              <dd className="mt-0.5 font-semibold">
                {formatDate(b.createdAt)}
              </dd>
            </div>

            <div className="col-span-2 min-w-0">
              <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-brand" /> Event location
              </dt>
              <dd className="mt-0.5 truncate font-semibold">
                {b.eventLocation}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-border pt-4">
            <motion.button
              type="button"
              onClick={onView}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to) px-5 py-2.5 text-xs font-semibold text-(--logo-fg) shadow-md shadow-brand/25"
              style={{ transform: "translateZ(30px)" }}
            >
              <Eye className="h-4 w-4" /> View details
            </motion.button>

            {b.status === "pending" && (
              <motion.button
                type="button"
                onClick={onCancel}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-5 py-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white"
              >
                <X className="h-4 w-4" /> Cancel
              </motion.button>
            )}
          </div>
        </div>
      </motion.article>
    </motion.li>
  );
}

// page
export default function MyBookings() {
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const { user } = useCustomerUser();
  const { bookings, setBookings, error, reload } = useBookings(user?.id);

  const initial = params.get("status");
  const [filter, setFilter] = useState<Filter>(
    ["pending", "accepted", "rejected", "cancelled"].includes(initial ?? "")
      ? (initial as Filter)
      : "all",
  );

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [viewing, setViewing] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => countBy(bookings ?? []), [bookings]);

  const list = useMemo(() => {
    if (!bookings) return [];

    const needle = q.trim().toLowerCase();
    const out = bookings.filter(
      (b) =>
        (filter === "all" || b.status === filter) &&
        (!needle ||
          (b.service?.name ?? "").toLowerCase().includes(needle) ||
          (b.vendor?.businessName ?? "").toLowerCase().includes(needle)),
    );

    const by: Record<Sort, (a: Booking, c: Booking) => number> = {
      newest: (a, c) => +new Date(c.createdAt) - +new Date(a.createdAt),
      soonest: (a, c) => +parseDate(a.eventDate) - +parseDate(c.eventDate),
      latest: (a, c) => +parseDate(c.eventDate) - +parseDate(a.eventDate),
    };

    return [...out].sort(by[sort]);
  }, [bookings, filter, q, sort]);

  const confirmCancel = async () => {
    if (!cancelling || !user) return;
    setBusy(true);

    try {
      const res = await cancelBooking(cancelling.id, user.id);

      setBookings(
        (prev) =>
          prev?.map((b) =>
            b.id === cancelling.id
              ? { ...b, status: res.status, cancelledAt: res.cancelledAt }
              : b,
          ) ?? prev,
      );

      toast.success("Request cancelled", {
        description: "The vendor won't see it as an active request any more.",
      });

      setCancelling(null);
      setViewing(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error("Can't cancel this request", { description: e.message });
        setCancelling(null);
        reload(); // it changed on the server: show the real status
      } else if (e instanceof ApiError && e.status === 403) {
        toast.error("You can only cancel your own bookings.");
        setCancelling(null);
      } else {
        toast.error("Couldn't cancel the request", {
          description: "Please check your connection and try again.",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const tabs: { key: Filter; label: string; n: number }[] = [
    { key: "all", label: "All", n: counts.total },
    { key: "pending", label: "Pending", n: counts.pending },
    { key: "accepted", label: "Accepted", n: counts.accepted },
    { key: "rejected", label: "Rejected", n: counts.rejected },
    { key: "cancelled", label: "Cancelled", n: counts.cancelled },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Your requests"
        title="My Bookings"
        subtitle="Track every booking request, see the vendor's decision and cancel requests that are still pending."
      >
        <Link
          href="/services"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-brand/50 hover:bg-brand-soft"
        >
          <Search className="h-4 w-4" /> Find more services
        </Link>
      </PageHeader>

      {/* controls */}
      <div className="relative z-20 mb-8 space-y-4 rounded-3xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur sm:p-5">
        <div
          role="tablist"
          aria-label="Filter by status"
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        >
          {tabs.map((t) => {
            const on = filter === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={on}
                onClick={() => setFilter(t.key)}
                className={`relative shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${on ? "text-brand-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {on && (
                  <motion.span
                    layoutId="booking-tab"
                    className="absolute inset-0 rounded-full bg-linear-to-r from-(--logo-from) to-brand shadow-md shadow-brand/30"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}

                <span className="relative flex items-center gap-2">
                  {t.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${on ? "bg-white/25" : "bg-muted"}`}
                  >
                    {t.n}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_16rem]">
          <div>
            <label
              htmlFor="bk-search"
              className="mb-1.5 block px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              Search
            </label>

            <div className="group relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-brand" />

              <input
                id="bk-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Service or vendor name…"
                autoComplete="off"
                className="h-14 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/70 focus:border-brand focus:ring-4 focus:ring-brand/20 [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
          </div>

          <FancySelect
            label="Sort by"
            icon={ArrowUpDown}
            value={sort}
            onChange={(v) => setSort(v as Sort)}
            options={SORTS}
          />
        </div>
      </div>

      {/* results */}
      <div className="relative z-0">
        {error ? (
          <div className="mx-auto max-w-md rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="font-semibold text-destructive">{error}</p>

            <button
              type="button"
              onClick={reload}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : bookings === null ? (
          <ul
            className="grid gap-6 xl:grid-cols-2"
            aria-busy="true"
            aria-label="Loading bookings"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="overflow-hidden rounded-3xl border border-border bg-card"
              >
                <div className="aspect-16/8 animate-pulse bg-muted" />

                <div className="space-y-3 p-5">
                  <div className="h-5 w-3/5 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
                  <div className="h-16 animate-pulse rounded-xl bg-muted" />
                </div>
              </li>
            ))}
          </ul>
        ) : list.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-card/70 p-10 text-center"
          >
            <motion.span
              animate={reduce ? undefined : { rotate: [-8, 8, -8] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand"
            >
              {bookings.length === 0 ? (
                <Inbox className="h-8 w-8" />
              ) : (
                <SearchX className="h-8 w-8" />
              )}
            </motion.span>

            <h2 className="mt-5 font-serif text-xl font-semibold">
              {bookings.length === 0
                ? "No booking requests yet"
                : "No bookings match"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {bookings.length === 0
                ? "Browse services and send your first booking request."
                : "Try another status, or clear the search."}
            </p>

            {bookings.length === 0 ? (
              <Link
                href="/services"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"
              >
                Browse services
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setQ("");
                }}
                className="mt-5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          <motion.ul layout={!reduce} className="grid gap-6 xl:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {list.map((b, i) => (
                <BookingCard
                  key={b.id}
                  b={b}
                  index={i}
                  onView={() => setViewing(b)}
                  onCancel={() => setCancelling(b)}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      <DetailsDialog
        b={viewing}
        onClose={() => setViewing(null)}
        onCancel={(b) => setCancelling(b)}
      />

      <CancelDialog
        b={cancelling}
        busy={busy}
        onClose={() => setCancelling(null)}
        onConfirm={confirmCancel}
      />
    </div>
  );
}
