"use client";

/**
 * WedPlan - Vendor "Booking Requests"
 * Place at: components/dashboard/vendor/booking-requests.tsx
 * Used by: app/dashboard/vendor/bookings/page.tsx
 *
 * Shows customer info, service info, event date, event location, customer message and status.
 * Actions: Accept / Reject, ONLY for pending requests, each with a confirmation step.
 * Rules: once accepted or rejected a request can't be processed again, and a vendor can only touch
 * requests for their own services. The server must enforce both.
 */

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
} from "@/components/dashboard/customer/customer-shared";
import {
  useVendorBookings,
  useVendorUser,
} from "@/components/dashboard/vendor/vendor-shared";
import { useTilt } from "@/components/home/section-kit";
import FancySelect, { type SelectOption } from "@/components/ui/fancy-select";
import type { BookingStatus } from "@/lib/bookings-api";
import {
  ApiError,
  respondToBooking,
  type VendorBooking,
} from "@/lib/vendor-api";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpDown,
  CalendarDays,
  Check,
  ChevronDown,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  SearchX,
  X,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Filter = "all" | BookingStatus;
type Sort = "newest" | "soonest" | "latest";
const SORTS: SelectOption[] = [
  { value: "newest", label: "Newest requests" },
  { value: "soonest", label: "Event date: soonest" },
  { value: "latest", label: "Event date: latest" },
];

function Request({
  b,
  index,
  conflict,
  onDecide,
}: {
  b: VendorBooking;
  index: number;
  conflict: boolean;
  onDecide: (d: "accepted" | "rejected") => void;
}) {
  const { ref, reduce, style, glare, handlers } = useTilt(3, 12);
  const [open, setOpen] = useState(false);
  const long = b.message.length > 140;
  const m = STATUS_META[b.status];

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 36, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.94, transition: { duration: 0.15 } }
      }
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 18,
        delay: Math.min(index, 6) * 0.05,
      }}
      className="perspective-[1400px]"
    >
      <motion.article
        ref={ref}
        {...handlers}
        style={style}
        className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg transition-shadow duration-500 hover:shadow-2xl hover:shadow-brand/15"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ background: `linear-gradient(180deg, ${m.from}, ${m.to})` }}
        />

        <motion.div
          aria-hidden
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        />

        <div className="grid gap-5 p-5 pl-7 sm:p-6 sm:pl-8 lg:grid-cols-[15rem_1fr_auto]">
          {/* customer + service */}
          <div className="space-y-4">
            <div
              className="flex items-center gap-3"
              style={{ transform: "translateZ(30px)" }}
            >
              <Avatar
                src={b.customer?.image}
                name={b.customer?.name ?? "Customer"}
                size={52}
                className="ring-2 ring-brand/30"
              />

              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {b.customer?.name ?? "Unknown customer"}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground">
              {b.customer?.email && (
                <p className="flex items-center gap-2 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-brand" />{" "}
                  <a
                    href={`mailto:${b.customer.email}`}
                    className="truncate hover:text-foreground hover:underline"
                  >
                    {b.customer.email}
                  </a>
                </p>
              )}

              {b.customer?.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-brand" />{" "}
                  <a
                    href={`tel:${b.customer.phone}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {b.customer.phone}
                  </a>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-2.5">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                {b.service?.image && (
                  <Image
                    src={b.service.image}
                    alt=""
                    loading="lazy"
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 text-xs">
                <p className="truncate font-semibold">
                  {b.service?.name ?? "Service removed"}
                </p>
                <p className="truncate text-muted-foreground">
                  {b.service
                    ? `${money(b.service.price)} ${b.service.priceType}`
                    : ""}
                </p>
              </div>
            </div>
          </div>

          {/* event details */}
          <div className="min-w-0 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  I: CalendarDays,
                  k: "Event date",
                  v: formatDate(b.eventDate),
                },
                { I: MapPin, k: "Event location", v: b.eventLocation },
                { I: CalendarDays, k: "Requested", v: formatDate(b.createdAt) },
              ].map(({ I, k, v }) => (
                <div key={k} className="min-w-0 rounded-2xl bg-muted/40 p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <I className="h-3.5 w-3.5 text-brand" /> {k}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold" title={v}>
                    {v}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5 text-brand" /> Customer
                message
              </p>
              <p
                className={`mt-1.5 whitespace-pre-line text-sm leading-relaxed ${b.message ? "" : "italic text-muted-foreground"} ${!open && long ? "line-clamp-2" : ""}`}
              >
                {b.message || "The customer didn't add a message."}
              </p>

              {long && (
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  {open ? "Show less" : "Read more"}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>

            {conflict && (
              <p className="flex items-start gap-2 rounded-2xl bg-gold/20 p-3 text-xs font-medium">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                You&apos;ve already accepted another request for this service on
                this date.
              </p>
            )}
          </div>

          {/* status & actions */}
          <div
            className="flex flex-row items-center justify-between gap-3 lg:w-44 lg:flex-col lg:items-end lg:justify-start"
            style={{ transform: "translateZ(40px)" }}
          >
            <StatusBadge status={b.status} className="shadow-md" />
            {b.status === "pending" ? (
              <div className="flex gap-2 lg:w-full lg:flex-col">
                <motion.button
                  type="button"
                  onClick={() => onDecide("accepted")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-linear-to-r from-[oklch(0.7_0.16_160)] to-[oklch(0.55_0.13_180)] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-success/30"
                >
                  <Check className="h-4 w-4" strokeWidth={3} /> Accept
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => onDecide("rejected")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-destructive/30 px-5 py-2.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white"
                >
                  <X className="h-4 w-4" strokeWidth={3} /> Reject
                </motion.button>
              </div>
            ) : (
              <p className="max-w-44 text-right text-[11px] leading-snug text-muted-foreground">
                {b.status === "cancelled"
                  ? "Cancelled by the customer."
                  : "Already processed. This can't be changed."}
              </p>
            )}
          </div>
        </div>
      </motion.article>
    </motion.li>
  );
}

export default function BookingRequests() {
  const reduce = useReducedMotion();
  const { user } = useVendorUser();
  const { bookings, setBookings, error, reload } = useVendorBookings(user?.id);

  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [deciding, setDeciding] = useState<{
    b: VendorBooking;
    d: "accepted" | "rejected";
  } | null>(null);

  const [lastDeciding, setLast] = useState<typeof deciding>(null);
  const [busy, setBusy] = useState(false);
  if (deciding && deciding !== lastDeciding) setLast(deciding);
  const cur = deciding ?? lastDeciding;

  const counts = useMemo(() => countBy((bookings ?? []) as never), [bookings]);

  const acceptedKeys = useMemo(
    () =>
      new Set(
        (bookings ?? [])
          .filter((b) => b.status === "accepted")
          .map((b) => `${b.serviceId}|${b.eventDate}`),
      ),
    [bookings],
  );

  const list = useMemo(() => {
    if (!bookings) return [];

    const needle = q.trim().toLowerCase();

    const out = bookings.filter(
      (b) =>
        (filter === "all" || b.status === filter) &&
        (!needle ||
          (b.customer?.name ?? "").toLowerCase().includes(needle) ||
          (b.service?.name ?? "").toLowerCase().includes(needle)),
    );

    const by: Record<Sort, (a: VendorBooking, c: VendorBooking) => number> = {
      newest: (a, c) => +new Date(c.createdAt) - +new Date(a.createdAt),
      soonest: (a, c) => +parseDate(a.eventDate) - +parseDate(c.eventDate),
      latest: (a, c) => +parseDate(c.eventDate) - +parseDate(a.eventDate),
    };

    return [...out].sort(by[sort]);
  }, [bookings, filter, q, sort]);

  const confirm = async () => {
    if (!deciding || !user) return;
    const { b, d } = deciding;
    setBusy(true);

    try {
      await respondToBooking(b.id, user.id, d);
      setBookings(
        (p) => p?.map((x) => (x.id === b.id ? { ...x, status: d } : x)) ?? p,
      );

      toast.success(
        d === "accepted" ? "Request accepted" : "Request rejected",
        {
          description: `${b.customer?.name ?? "The customer"} can now see your decision.`,
        },
      );
      setDeciding(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error("Already processed", { description: e.message });
        setDeciding(null);
        reload();
      } else if (e instanceof ApiError && e.status === 403) {
        toast.error("You can only manage requests for your own services.");
        setDeciding(null);
      } else
        toast.error("Couldn't update the request", {
          description: "Please check your connection and try again.",
        });
    } finally {
      setBusy(false);
    }
  };

  const tabs: { k: Filter; l: string; n: number }[] = [
    { k: "all", l: "All", n: counts.total },
    { k: "pending", l: "Pending", n: counts.pending },
    { k: "accepted", l: "Accepted", n: counts.accepted },
    { k: "rejected", l: "Rejected", n: counts.rejected },
    { k: "cancelled", l: "Cancelled", n: counts.cancelled },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Customer requests"
        title="Booking Requests"
        subtitle="Review requests for your services, then accept or reject the ones that are pending."
      />

      <div className="relative z-20 mb-8 space-y-4 rounded-3xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur sm:p-5">
        <div
          role="tablist"
          aria-label="Filter by status"
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        >
          {tabs.map((t) => {
            const on = filter === t.k;

            return (
              <button
                key={t.k}
                role="tab"
                aria-selected={on}
                onClick={() => setFilter(t.k)}
                className={`relative shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${on ? "text-brand-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {on && (
                  <motion.span
                    layoutId="req-tab"
                    className="absolute inset-0 rounded-full bg-linear-to-r from-(--logo-from) to-brand shadow-md shadow-brand/30"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}

                <span className="relative flex items-center gap-2">
                  {t.l}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${on ? "bg-white/25" : t.k === "pending" && t.n > 0 ? "bg-gold text-neutral-900" : "bg-muted"}`}
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
              htmlFor="rq-search"
              className="mb-1.5 block px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              Search
            </label>

            <div className="group relative">
              {/* Search */}
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-brand" />

              <input
                id="rq-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Customer or service name…"
                autoComplete="off"
                className="h-14 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/70 focus:border-brand focus:ring-4 focus:ring-brand/20 [&::-webkit-search-cancel-button]:hidden"
              />
            </div>
          </div>

          {/* Sort */}
          <FancySelect
            label="Sort by"
            icon={ArrowUpDown}
            value={sort}
            onChange={(v) => setSort(v as Sort)}
            options={SORTS}
          />
        </div>
      </div>

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
            className="space-y-5"
            aria-busy="true"
            aria-label="Loading requests"
          >
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-56 animate-pulse rounded-3xl border border-border bg-muted"
              />
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
                : "No requests match"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {bookings.length === 0
                ? "When customers request your services, they'll appear here."
                : "Try another status or clear the search."}
            </p>

            {bookings.length > 0 && (
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
          <motion.ul layout={!reduce} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {list.map((b, i) => (
                <Request
                  key={b.id}
                  b={b}
                  index={i}
                  conflict={
                    b.status === "pending" &&
                    acceptedKeys.has(`${b.serviceId}|${b.eventDate}`)
                  }
                  onDecide={(d) => setDeciding({ b, d })}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      <Modal
        open={!!deciding}
        onClose={() => setDeciding(null)}
        label={cur?.d === "accepted" ? "Accept request" : "Reject request"}
        busy={busy}
      >
        {cur && (
          <div className="p-7 text-center sm:p-9">
            <motion.span
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${cur.d === "accepted" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}
            >
              {cur.d === "accepted" ? (
                <Check className="h-8 w-8" strokeWidth={3} />
              ) : (
                <X className="h-8 w-8" strokeWidth={3} />
              )}
            </motion.span>

            <h2 className="mt-5 font-serif text-2xl font-semibold">
              {cur.d === "accepted"
                ? "Accept this request?"
                : "Reject this request?"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <b className="text-foreground">
                {cur.b.customer?.name ?? "The customer"}
              </b>{" "}
              asked for{" "}
              <b className="text-foreground">
                {cur.b.service?.name ?? "your service"}
              </b>{" "}
              on{" "}
              <b className="text-foreground">{formatDate(cur.b.eventDate)}</b>.
              Once you {cur.d === "accepted" ? "accept" : "reject"} it,{" "}
              <b className="text-foreground">
                it can&apos;t be processed again
              </b>
              .
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setDeciding(null)}
                disabled={busy}
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent disabled:opacity-50"
              >
                Go back
              </button>

              <button
                type="button"
                onClick={confirm}
                disabled={busy}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-80 ${cur.d === "accepted" ? "bg-linear-to-r from-[oklch(0.7_0.16_160)] to-[oklch(0.55_0.13_180)] shadow-success/30" : "bg-destructive shadow-destructive/30"}`}
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : cur.d === "accepted" ? (
                  "Yes, accept"
                ) : (
                  "Yes, reject"
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
