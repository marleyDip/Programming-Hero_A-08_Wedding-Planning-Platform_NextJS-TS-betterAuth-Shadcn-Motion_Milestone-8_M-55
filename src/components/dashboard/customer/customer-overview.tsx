"use client";

/**
 * WedPlan - Customer Dashboard Overview
 * Place at: components/dashboard/customer/customer-overview.tsx
 * Used by: app/dashboard/customer/page.tsx
 *
 * Required stats: Total Booking Requests, Pending, Accepted, Rejected (+ cancelled shown in the chart).
 * Extras built from the same real data: status donut, "next event" countdown, recent requests.
 */

import { CountUp, useTilt } from "@/components/home/section-kit";
import type { Booking, BookingStatus } from "@/lib/bookings-api";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CalendarHeart,
  CheckCircle2,
  Clock,
  Compass,
  Heart,
  Inbox,
  MapPin,
  RefreshCw,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  Avatar,
  STATUS_META,
  StatusBadge,
  countBy,
  daysUntil,
  formatDate,
  parseDate,
  useBookings,
  useCustomerUser,
} from "./customer-shared";

// hero
function Hero({
  name,
  pending,
  nextEvent,
}: {
  name: string;
  pending: number | null;
  nextEvent: number | null;
}) {
  const { ref, reduce, style, glare, sx, sy, handlers } = useTilt(4, 26);
  const first = name.split(" ")[0];
  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const subtitle =
    pending === null
      ? "Loading your planning summary…"
      : nextEvent !== null
        ? nextEvent === 0
          ? "Your event is today. Congratulations!"
          : `Your next confirmed event is in ${nextEvent} ${nextEvent === 1 ? "day" : "days"}.`
        : pending > 0
          ? `You have ${pending} pending ${pending === 1 ? "request" : "requests"} waiting for a vendor reply.`
          : "Ready to find the perfect vendors for your big day?";

  return (
    <div className="perspective:[1400px]">
      <motion.section
        ref={ref}
        {...handlers}
        style={style}
        className="relative overflow-hidden rounded-4xl bg-linear-to-br from-(--logo-from) via-brand to-[oklch(0.42_0.17_330)] p-7 text-white shadow-2xl shadow-brand/30 sm:p-10"
      >
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] bg-size-[22px_22px]" />

        <motion.div
          aria-hidden
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        />

        {/* floating 3D decor */}
        <motion.div
          aria-hidden
          style={{ x: sx, y: sy, transform: "translateZ(80px)" }}
          className="pointer-events-none absolute -right-4 -top-4 hidden text-white/20 sm:block"
        >
          <Heart className="h-52 w-52 fill-current" strokeWidth={0} />
        </motion.div>
        {[
          { I: Sparkles, cls: "right-24 top-10", z: 90, d: 0 },
          { I: CalendarHeart, cls: "right-10 bottom-8", z: 60, d: 0.8 },
        ].map(({ I, cls, z, d }, i) => (
          <motion.span
            key={i}
            aria-hidden
            animate={reduce ? undefined : { y: [0, -12, 0], rotate: [0, 8, 0] }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: d,
            }}
            style={{ z }}
            className={`absolute hidden h-14 w-14 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-xl backdrop-blur-md sm:grid ${cls}`}
          >
            <I className="h-6 w-6" />
          </motion.span>
        ))}

        <div
          className="relative max-w-xl"
          style={{ transform: "translateZ(40px)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
            {greet}
          </p>

          <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight sm:text-5xl">
            Welcome back, {first}!
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">
            {subtitle}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-xl"
              >
                <Compass className="h-4 w-4" /> Browse services
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/dashboard/customer/bookings"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur"
              >
                My bookings <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

// stat tile
function StatTile({
  label,
  value,
  total,
  icon: Icon,
  from,
  to,
  href,
  index,
}: {
  label: string;
  value: number | null;
  total: number;
  icon: LucideIcon;
  from: string;
  to: string;
  href: string;
  index: number;
}) {
  const { ref, reduce, style, glare, handlers } = useTilt(10, 18);
  const pct = total ? Math.round(((value ?? 0) / total) * 100) : 0;

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 40, rotateX: -24 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        type: "spring",
        stiffness: 90,
        damping: 15,
        delay: 0.1 + index * 0.08,
      }}
      style={{ transformOrigin: "50% 100%" }}
    >
      <Link
        href={href}
        className="group block rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
        aria-label={`${label}: ${value ?? "loading"}`}
      >
        <motion.div
          ref={ref}
          {...handlers}
          whileHover={reduce ? undefined : { y: -6 }}
          style={style}
          className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-lg transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-brand/20"
        >
          <motion.div
            aria-hidden
            style={{ background: glare }}
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity group-hover:opacity-100"
          />

          <Icon
            aria-hidden
            className="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 opacity-[0.07]"
            strokeWidth={1.2}
          />

          <div className="relative flex items-start justify-between">
            <span
              className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg"
              style={{
                background: `linear-gradient(145deg, ${from}, ${to})`,
                boxShadow: `0 12px 24px -10px ${to}`,
                transform: "translateZ(50px)",
              }}
            >
              <Icon className="h-6 w-6" strokeWidth={1.8} />
            </span>

            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
          </div>

          <p
            className="relative mt-5 font-serif text-4xl font-semibold"
            style={{ transform: "translateZ(30px)" }}
          >
            {value === null ? (
              <span className="inline-block h-9 w-12 animate-pulse rounded bg-muted align-middle" />
            ) : (
              <CountUp to={value} />
            )}
          </p>

          <p className="relative mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>

          <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{
                type: "spring",
                stiffness: 60,
                damping: 16,
                delay: 0.5 + index * 0.08,
              }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
            />
          </div>
        </motion.div>
      </Link>
    </motion.li>
  );
}

// donut
function Donut({ counts }: { counts: ReturnType<typeof countBy> }) {
  const order: BookingStatus[] = [
    "pending",
    "accepted",
    "rejected",
    "cancelled",
  ];

  let acc = 0;
  const slices = order
    .filter((s) => counts[s] > 0)
    .map((s) => {
      const pct = (counts[s] / counts.total) * 100;
      const sl = { s, n: counts[s], pct, offset: -acc };
      acc += pct;

      return sl;
    });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <svg
          viewBox="0 0 42 42"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label="Booking requests by status"
        >
          <defs>
            {order.map((s) => (
              <linearGradient
                key={s}
                id={`dn-${s}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={STATUS_META[s].from} />
                <stop offset="100%" stopColor={STATUS_META[s].to} />
              </linearGradient>
            ))}
          </defs>

          <circle
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="5"
          />

          {slices.map((sl, i) => (
            <motion.circle
              key={sl.s}
              cx="21"
              cy="21"
              r="15.9155"
              fill="none"
              stroke={`url(#dn-${sl.s})`}
              strokeWidth="5"
              strokeDashoffset={sl.offset}
              initial={{ strokeDasharray: "0 100" }}
              animate={{
                strokeDasharray: `${Math.max(sl.pct - (slices.length > 1 ? 0.8 : 0), 0.1)} 100`,
              }}
              transition={{
                type: "spring",
                stiffness: 70,
                damping: 16,
                delay: 0.3 + i * 0.1,
              }}
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-serif text-3xl font-semibold leading-none">
              {counts.total}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              requests
            </p>
          </div>
        </div>
      </div>

      <ul className="grid w-full gap-2 text-sm">
        {order.map((s) => (
          <li
            key={s}
            className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2"
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${STATUS_META[s].from}, ${STATUS_META[s].to})`,
              }}
            />

            <span className="flex-1 font-medium">{STATUS_META[s].label}</span>

            <span className="font-mono text-xs text-muted-foreground">
              {counts[s]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// next event
function NextEvent({ booking }: { booking: Booking | null }) {
  const reduce = useReducedMotion();

  if (!booking) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-6 text-center">
        <motion.span
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand"
        >
          <CalendarHeart className="h-8 w-8" />
        </motion.span>

        <p className="mt-4 font-serif text-lg font-semibold">
          No upcoming events yet
        </p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Once a vendor accepts a request, your countdown appears here.
        </p>

        <Link
          href="/services"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
        >
          Find a vendor <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const days = daysUntil(booking.eventDate);
  const d = parseDate(booking.eventDate);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-5">
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-linear-to-br from-(--logo-from) to-brand text-center text-white shadow-xl shadow-brand/30">
          <div>
            <p className="font-serif text-4xl font-bold leading-none">
              {days === 0 ? "Today" : <CountUp to={days} />}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/80">
              {days === 0 ? "" : days === 1 ? "day to go" : "days to go"}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {d.toLocaleDateString("en-GB", { weekday: "long" })}
          </p>
          <p className="font-serif text-2xl font-semibold">
            {formatDate(booking.eventDate)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-brand" />{" "}
            {booking.eventLocation}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
        <Avatar
          src={booking.vendor?.image}
          name={booking.vendor?.businessName ?? "Vendor"}
          size={40}
        />

        <div className="min-w-0 text-sm">
          <p className="truncate font-semibold">
            {booking.service?.name ?? "Service"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {booking.vendor?.businessName ?? "Vendor"}
          </p>
        </div>

        <StatusBadge status="accepted" className="ml-auto" />
      </div>
    </div>
  );
}

// page
function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: "spring", stiffness: 90, damping: 18 }}
      className={`rounded-3xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {action}
      </div>

      {children}
    </motion.section>
  );
}

export default function CustomerOverview() {
  const { user } = useCustomerUser();
  const { bookings, error, reload } = useBookings(user?.id);

  const counts = useMemo(
    () => (bookings ? countBy(bookings) : null),
    [bookings],
  );

  const next = useMemo(
    () =>
      bookings
        ?.filter((b) => b.status === "accepted" && daysUntil(b.eventDate) >= 0)
        .sort((a, b) => +parseDate(a.eventDate) - +parseDate(b.eventDate))[0] ??
      null,
    [bookings],
  );

  const tiles: {
    label: string;
    key: "total" | "pending" | "accepted" | "rejected";
    icon: LucideIcon;
    from: string;
    to: string;
    href: string;
  }[] = [
    {
      label: "Total requests",
      key: "total",
      icon: Inbox,
      from: "oklch(0.7 0.16 305)",
      to: "oklch(0.46 0.2 285)",
      href: "/dashboard/customer/bookings",
    },
    {
      label: "Pending",
      key: "pending",
      icon: Clock,
      from: STATUS_META.pending.from,
      to: STATUS_META.pending.to,
      href: "/dashboard/customer/bookings?status=pending",
    },
    {
      label: "Accepted",
      key: "accepted",
      icon: CheckCircle2,
      from: STATUS_META.accepted.from,
      to: STATUS_META.accepted.to,
      href: "/dashboard/customer/bookings?status=accepted",
    },
    {
      label: "Rejected",
      key: "rejected",
      icon: XCircle,
      from: STATUS_META.rejected.from,
      to: STATUS_META.rejected.to,
      href: "/dashboard/customer/bookings?status=rejected",
    },
  ];

  return (
    <div className="space-y-8">
      <Hero
        name={user?.name ?? "there"}
        pending={counts ? counts.pending : null}
        nextEvent={next ? daysUntil(next.eventDate) : null}
      />

      {error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-semibold text-destructive">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : (
        <>
          <ul
            className="grid grid-cols-2 gap-4 perspective:[1400px] lg:grid-cols-4"
            aria-label="Booking summary"
          >
            {tiles.map((t, i) => (
              <StatTile
                key={t.key}
                index={i}
                label={t.label}
                value={counts ? counts[t.key] : null}
                total={counts?.total ?? 0}
                icon={t.icon}
                from={t.from}
                to={t.to}
                href={t.href}
              />
            ))}
          </ul>

          {counts && counts.total === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-dashed border-border bg-card/70 p-10 text-center"
            >
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand">
                <CalendarCheck className="h-8 w-8" />
              </span>
              <h2 className="mt-5 font-serif text-2xl font-semibold">
                Start planning your wedding
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                You haven&apos;t sent any booking requests yet. Browse
                photographers, venues, decorators and more, then request a
                booking in a few clicks.
              </p>
              <Link
                href="/services"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to) px-6 py-3 text-sm font-semibold text-(--logo-fg) shadow-lg shadow-brand/30"
              >
                Explore wedding services <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card
                  title="Requests by status"
                  subtitle="How your booking requests are going"
                >
                  {counts ? (
                    <Donut counts={counts} />
                  ) : (
                    <div className="h-44 animate-pulse rounded-2xl bg-muted" />
                  )}
                </Card>

                <Card
                  title="Next event"
                  subtitle="Your closest accepted booking"
                >
                  {bookings ? (
                    <NextEvent booking={next} />
                  ) : (
                    <div className="h-44 animate-pulse rounded-2xl bg-muted" />
                  )}
                </Card>
              </div>

              <Card
                title="Recent requests"
                subtitle="Your latest booking activity"
                action={
                  <Link
                    href="/dashboard/customer/bookings"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                  >
                    View all <ArrowUpRight className="h-4 w-4" />
                  </Link>
                }
              >
                {bookings ? (
                  <ul className="divide-y divide-border">
                    {bookings.slice(0, 4).map((b, i) => (
                      <motion.li
                        key={b.id}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
                          {b.service?.image && (
                            <Image
                              src={b.service.image}
                              alt={b.service.name ?? "Service image"}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {b.service?.name ?? "Service no longer available"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {b.vendor?.businessName ?? "Vendor"} ·{" "}
                            {formatDate(b.eventDate)}
                          </p>
                        </div>

                        <StatusBadge status={b.status} />
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-14 animate-pulse rounded-2xl bg-muted"
                      />
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
