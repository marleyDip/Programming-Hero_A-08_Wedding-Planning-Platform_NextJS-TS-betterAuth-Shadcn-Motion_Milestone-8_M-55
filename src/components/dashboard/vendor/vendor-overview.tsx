"use client";

/**
 * WedPlan - Vendor Dashboard Overview
 * Place at: components/dashboard/vendor/vendor-overview.tsx
 * Used by: app/dashboard/vendor/page.tsx
 *
 * Required cards: Total Services, Active Services, Pending Booking Requests, Accepted Bookings,
 * Current Subscription Plan. Extras (all from real data): booking requests per month, services by
 * approval status, Free-plan usage meter, upcoming accepted events, requests waiting for a reply.
 */

import {
  Avatar,
  StatusBadge,
  daysUntil,
  formatDate,
  parseDate,
} from "@/components/dashboard/customer/customer-shared";
import {
  FREE_LIMIT,
  PremiumBadge,
  SERVICE_STATUS,
  activeCount,
  isPremium,
  useVendorBookings,
  useVendorServices,
  useVendorUser,
} from "@/components/dashboard/vendor/vendor-shared";
import { CountUp, useTilt } from "@/components/home/section-kit";
import type { ServiceStatus } from "@/lib/vendor-api";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  CalendarCheck,
  CalendarHeart,
  CheckCircle2,
  Clock,
  Crown,
  Inbox,
  PackagePlus,
  RefreshCw,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

// hero
function Hero({
  name,
  pending,
  premium,
}: {
  name: string;
  pending: number | null;
  premium: boolean;
}) {
  const { ref, reduce, style, glare, sx, sy, handlers } = useTilt(4, 26);

  const hour = new Date().getHours();
  const greet =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const sub =
    pending === null
      ? "Loading your business summary…"
      : pending > 0
        ? `You have ${pending} booking ${pending === 1 ? "request" : "requests"} waiting for your reply.`
        : "No requests are waiting. Keep your listings fresh to attract more couples.";

  return (
    <div className="perspective-[1400px]">
      <motion.section
        ref={ref}
        {...handlers}
        style={style}
        className="relative overflow-hidden rounded-4xl bg-linear-to-br from-[oklch(0.4_0.16_300)] via-[oklch(0.5_0.2_340)] to-(--logo-from) p-7 text-white shadow-2xl shadow-brand/30 sm:p-10"
      >
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] bg-size-[22px_22px]" />

        <motion.div
          aria-hidden
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        />

        <motion.div
          aria-hidden
          style={{ x: sx, y: sy, transform: "translateZ(80px)" }}
          className="pointer-events-none absolute -right-6 -top-6 hidden text-white/15 sm:block"
        >
          <Crown className="h-56 w-56" strokeWidth={0.8} />
        </motion.div>

        {[
          { I: Sparkles, c: "right-28 top-10", d: 0 },
          { I: CalendarHeart, c: "right-10 bottom-8", d: 0.8 },
        ].map(({ I, c, d }, i) => (
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
            style={{ z: 70 + i * 20 }}
            className={`absolute hidden h-14 w-14 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-xl backdrop-blur-md sm:grid ${c}`}
          >
            <I className="h-6 w-6" />
          </motion.span>
        ))}

        <div
          className="relative max-w-xl"
          style={{ transform: "translateZ(40px)" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
              {greet}
            </p>
            {premium && <PremiumBadge />}
          </div>

          <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight sm:text-5xl">
            Welcome back, {name}!
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">
            {sub}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/dashboard/vendor/services/new"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-xl"
              >
                <PackagePlus className="h-4 w-4" /> Add a service
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/dashboard/vendor/bookings"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur"
              >
                Booking requests <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

// stat tile
function Tile({
  label,
  value,
  text,
  icon: Icon,
  from,
  to,
  href,
  index,
  wide,
}: {
  label: string;
  value: number | null;
  text?: string;
  icon: LucideIcon;
  from: string;
  to: string;
  href: string;
  index: number;
  wide?: boolean;
}) {
  const { ref, reduce, style, glare, handlers } = useTilt(10, 18);

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 40, rotateX: -24 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        type: "spring",
        stiffness: 90,
        damping: 15,
        delay: 0.1 + index * 0.07,
      }}
      style={{ transformOrigin: "50% 100%" }}
      className={wide ? "col-span-2 lg:col-span-1" : ""}
    >
      <Link
        href={href}
        className="group block rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
        aria-label={`${label}: ${text ?? value ?? "loading"}`}
      >
        <motion.div
          ref={ref}
          {...handlers}
          whileHover={reduce ? undefined : { y: -6 }}
          style={style}
          className="relative h-full overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-lg transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-brand/20"
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
            {text ? (
              text
            ) : value === null ? (
              <span className="inline-block h-9 w-12 animate-pulse rounded bg-muted align-middle" />
            ) : (
              <CountUp to={value} />
            )}
          </p>

          <p className="relative mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        </motion.div>
      </Link>
    </motion.li>
  );
}

// cards
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

function MonthlyBars({ data }: { data: { label: string; n: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.n));

  return (
    <div>
      <div
        className="flex h-44 items-end gap-3"
        role="img"
        aria-label="Booking requests per month"
      >
        {data.map((d, i) => (
          <div
            key={d.label + i}
            className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100">
              {d.n}
            </span>

            <motion.div
              initial={{ height: 0 }}
              whileInView={{
                height: `${Math.max((d.n / max) * 100, d.n ? 8 : 3)}%`,
              }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 70,
                damping: 16,
                delay: i * 0.07,
              }}
              className="w-full rounded-t-xl bg-linear-to-t from-(--logo-from) to-(--logo-to) shadow-md transition-[filter] group-hover:brightness-110"
              style={{ opacity: d.n ? 1 : 0.25 }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-3">
        {data.map((d, i) => (
          <span
            key={d.label + i}
            className="flex-1 text-center text-[11px] font-medium text-muted-foreground"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusDonut({
  counts,
  total,
}: {
  counts: Record<ServiceStatus, number>;
  total: number;
}) {
  const order: ServiceStatus[] = ["approved", "pending", "rejected"];
  let acc = 0;

  const slices = order
    .filter((s) => counts[s] > 0)
    .map((s) => {
      const pct = (counts[s] / total) * 100;
      const sl = { s, pct, offset: -acc };
      acc += pct;
      return sl;
    });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-36 w-36 shrink-0">
        <svg
          viewBox="0 0 42 42"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label="Services by approval status"
        >
          <defs>
            {order.map((s) => (
              <linearGradient
                key={s}
                id={`sd-${s}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={SERVICE_STATUS[s].from} />
                <stop offset="100%" stopColor={SERVICE_STATUS[s].to} />
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
              stroke={`url(#sd-${sl.s})`}
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
              {total}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              services
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
                background: `linear-gradient(135deg, ${SERVICE_STATUS[s].from}, ${SERVICE_STATUS[s].to})`,
              }}
            />

            <span className="flex-1 font-medium">
              {SERVICE_STATUS[s].label}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {counts[s]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// page
export default function VendorOverview() {
  const { user } = useVendorUser();
  const premium = isPremium(user);
  const {
    services,
    error: sErr,
    reload: reloadS,
  } = useVendorServices(user?.id);
  const {
    bookings,
    error: bErr,
    reload: reloadB,
  } = useVendorBookings(user?.id);

  const active = services ? activeCount(services) : null;
  const pending = bookings
    ? bookings.filter((b) => b.status === "pending")
    : null;
  const accepted = bookings
    ? bookings.filter((b) => b.status === "accepted")
    : null;

  const statusCounts = useMemo(() => {
    const c: Record<ServiceStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    services?.forEach((s) => c[s.status]++);
    return c;
  }, [services]);

  const months = useMemo(() => {
    const out: { key: string; label: string; n: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-GB", { month: "short" }),
        n: 0,
      });
    }

    bookings?.forEach((b) => {
      const d = new Date(b.createdAt);
      const m = out.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) m.n++;
    });

    return out;
  }, [bookings]);

  const upcoming = useMemo(
    () =>
      accepted
        ?.filter((b) => daysUntil(b.eventDate) >= 0)
        .sort((a, b) => +parseDate(a.eventDate) - +parseDate(b.eventDate))
        .slice(0, 4) ?? null,
    [accepted],
  );

  const tiles = [
    {
      label: "Total services",
      value: services ? services.length : null,
      icon: Boxes,
      from: "oklch(0.7 0.16 305)",
      to: "oklch(0.46 0.2 285)",
      href: "/dashboard/vendor/services",
    },
    {
      label: "Active services",
      value: active,
      icon: Zap,
      from: "oklch(0.78 0.15 160)",
      to: "oklch(0.52 0.12 180)",
      href: "/dashboard/vendor/services",
    },
    {
      label: "Pending requests",
      value: pending ? pending.length : null,
      icon: Clock,
      from: "oklch(0.84 0.13 80)",
      to: "oklch(0.62 0.17 50)",
      href: "/dashboard/vendor/bookings",
    },
    {
      label: "Accepted bookings",
      value: accepted ? accepted.length : null,
      icon: CheckCircle2,
      from: "oklch(0.74 0.15 28)",
      to: "oklch(0.5 0.21 10)",
      href: "/dashboard/vendor/bookings",
    },
  ];

  const bizName = user?.businessName || user?.name?.split(" ")[0] || "there";
  const hasError = sErr || bErr;

  return (
    <div className="space-y-8">
      <Hero
        name={bizName}
        pending={pending ? pending.length : null}
        premium={premium}
      />

      {hasError ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="font-semibold text-destructive">{sErr ?? bErr}</p>

          <button
            type="button"
            onClick={() => {
              reloadS();
              reloadB();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : (
        <>
          <ul
            className="grid grid-cols-2 gap-4 perspective-[1400px] lg:grid-cols-3 xl:grid-cols-5"
            aria-label="Business summary"
          >
            {tiles.map((t, i) => (
              <Tile key={t.label} index={i} {...t} />
            ))}

            <Tile
              index={4}
              wide
              label="Current plan"
              value={null}
              text={premium ? "Premium" : "Free"}
              icon={Crown}
              from="oklch(0.85 0.14 85)"
              to="oklch(0.66 0.16 55)"
              href="/dashboard/vendor/subscription"
            />
          </ul>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <Card
              title="Booking requests"
              subtitle="Requests received in the last 6 months"
            >
              {bookings ? (
                <MonthlyBars data={months} />
              ) : (
                <div className="h-52 animate-pulse rounded-2xl bg-muted" />
              )}
            </Card>

            <Card
              title="Plan usage"
              subtitle={premium ? "Premium plan" : "Free plan"}
            >
              {premium ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <motion.span
                    animate={{ rotate: [0, -8, 8, 0], y: [0, -6, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="grid h-16 w-16 place-items-center rounded-2xl bg-linear-to-br from-[oklch(0.85_0.14_85)] to-[oklch(0.66_0.16_55)] text-neutral-900 shadow-xl"
                  >
                    <Crown className="h-8 w-8" />
                  </motion.span>

                  <p className="mt-4 font-serif text-xl font-semibold">
                    Unlimited services
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {active ?? 0} active now. Your Premium badge shows on every
                    listing.
                  </p>

                  {user?.subscriptionExpiresAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Renews / ends {formatDate(user.subscriptionExpiresAt)}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-serif text-4xl font-semibold">
                    {active ?? "–"}
                    <span className="text-xl text-muted-foreground">
                      {" "}
                      / {FREE_LIMIT}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    active services on the Free plan
                  </p>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, ((active ?? 0) / FREE_LIMIT) * 100)}%`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 70,
                        damping: 16,
                      }}
                      className={`h-full rounded-full ${(active ?? 0) >= FREE_LIMIT ? "bg-destructive" : "bg-linear-to-r from-(--logo-from) to-(--logo-to)"}`}
                    />
                  </div>

                  <Link
                    href="/dashboard/vendor/subscription"
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to) px-5 py-2.5 text-sm font-semibold text-(--logo-fg) shadow-lg shadow-brand/30"
                  >
                    <Crown className="h-4 w-4" /> Upgrade to Premium
                  </Link>
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              title="Services by status"
              subtitle="Where your listings are in the approval process"
            >
              {services ? (
                services.length ? (
                  <StatusDonut counts={statusCounts} total={services.length} />
                ) : (
                  <div className="py-6 text-center">
                    <p className="font-serif text-lg font-semibold">
                      No services yet
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add your first service to start receiving requests.
                    </p>
                    <Link
                      href="/dashboard/vendor/services/new"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                    >
                      Add a service <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )
              ) : (
                <div className="h-36 animate-pulse rounded-2xl bg-muted" />
              )}
            </Card>

            <Card
              title="Upcoming events"
              subtitle="Your next accepted bookings"
              action={
                <Link
                  href="/dashboard/vendor/bookings"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                >
                  All <ArrowUpRight className="h-4 w-4" />
                </Link>
              }
            >
              {upcoming === null ? (
                <div className="h-36 animate-pulse rounded-2xl bg-muted" />
              ) : upcoming.length === 0 ? (
                <div className="flex flex-col items-center py-4 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
                    <CalendarHeart className="h-7 w-7" />
                  </span>
                  <p className="mt-3 text-sm text-muted-foreground">
                    No upcoming accepted events yet.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {upcoming.map((b, i) => {
                    const d = daysUntil(b.eventDate);
                    return (
                      <motion.li
                        key={b.id}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-3.5 rounded-2xl bg-muted/40 p-3"
                      >
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-(--logo-from) to-brand text-center text-white shadow-md">
                          <div>
                            <p className="font-serif text-lg font-bold leading-none">
                              {d === 0 ? "Today" : d}
                            </p>
                            {d > 0 && (
                              <p className="text-[9px] font-semibold uppercase">
                                {d === 1 ? "day" : "days"}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 text-sm">
                          <p className="truncate font-semibold">
                            {b.service?.name ?? "Service"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {b.customer?.name ?? "Customer"} ·{" "}
                            {formatDate(b.eventDate)}
                          </p>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          <Card
            title="Waiting for your reply"
            subtitle="Pending booking requests"
            action={
              <Link
                href="/dashboard/vendor/bookings"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
              >
                Review all <ArrowUpRight className="h-4 w-4" />
              </Link>
            }
          >
            {pending === null ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-2xl bg-muted"
                  />
                ))}
              </div>
            ) : pending.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-success/15 text-success">
                  <BadgeCheck className="h-7 w-7" />
                </span>
                <p className="mt-3 text-sm text-muted-foreground">
                  You&apos;re all caught up. No pending requests.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {pending.slice(0, 4).map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
                  >
                    <Avatar
                      src={b.customer?.image}
                      name={b.customer?.name ?? "Customer"}
                      size={44}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {b.customer?.name ?? "Customer"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b.service?.name ?? "Service"} ·{" "}
                        {formatDate(b.eventDate)}
                      </p>
                    </div>

                    <StatusBadge status="pending" />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {services &&
            bookings &&
            services.length === 0 &&
            bookings.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-dashed border-border bg-card/70 p-10 text-center"
              >
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <Inbox className="h-8 w-8" />
                </span>
                <h2 className="mt-5 font-serif text-2xl font-semibold">
                  Let&apos;s get your business listed
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Publish your first service. Once an admin approves it, couples
                  can find it and send you booking requests.
                </p>

                <Link
                  href="/dashboard/vendor/services/new"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to) px-6 py-3 text-sm font-semibold text-(--logo-fg) shadow-lg shadow-brand/30"
                >
                  <CalendarCheck className="h-4 w-4" /> Add your first service
                </Link>
              </motion.div>
            )}
        </>
      )}
    </div>
  );
}
