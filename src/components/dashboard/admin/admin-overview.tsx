"use client";

/**
 * WedPlan - Admin: Overview
 * Place at: components/dashboard/admin/admin-overview.tsx
 * Used by: app/dashboard/admin/page.tsx
 *
 * Total users, vendors, customers, services, pending services and transactions, all computed from live
 * data (nothing is hard-coded), plus a review queue, sign-ups, role split and the latest payments.
 */

import {
  Avatar,
  formatDate,
  money,
} from "@/components/dashboard/customer/customer-shared";
import { SERVICE_STATUS } from "@/components/dashboard/vendor/vendor-shared";
import { CountUp, useTilt } from "@/components/home/section-kit";
import type { ServiceStatus } from "@/lib/admin-api";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  CreditCard,
  Receipt,
  ShieldCheck,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  EmptyState,
  LoadError,
  ROLE_META,
  Skeleton,
  TxStatusBadge,
  formatAmount,
  useAdminUser,
  useServices,
  useTransactions,
  useUsers,
} from "./admin-shared";

function Tile({
  icon: Icon,
  label,
  value,
  from,
  to,
  index,
  href,
  alert,
}: {
  icon: typeof Users;
  label: string;
  value: number | null;
  from: string;
  to: string;
  index: number;
  href: string;
  alert?: boolean;
}) {
  const { ref, reduce, style, glare, sx, sy, handlers } = useTilt(11, 20);

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 44, rotateX: -26 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        type: "spring",
        stiffness: 90,
        damping: 15,
        delay: 0.1 + index * 0.07,
      }}
      style={{ transformOrigin: "50% 100%" }}
      className="perspective:[1000px]"
    >
      <Link
        href={href}
        className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
      >
        <motion.div
          ref={ref}
          {...handlers}
          whileHover={reduce ? undefined : { y: -6 }}
          style={style}
          className={`relative h-full overflow-hidden rounded-3xl border bg-card p-5 shadow-lg transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-brand/20 ${alert ? "border-gold/60" : "border-border"}`}
        >
          <motion.div
            aria-hidden
            style={{ background: glare }}
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          />

          <motion.div
            aria-hidden
            style={{
              x: sx,
              y: sy,
              z: 20,
              backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
            }}
            className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-25 blur-xl"
          />

          <span
            className="relative grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg"
            style={{
              transform: "translateZ(34px)",
              backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
            }}
          >
            <Icon className="h-6 w-6" />

            {alert && value ? (
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/70" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-gold ring-2 ring-card" />
              </span>
            ) : null}
          </span>

          <div
            className="relative mt-5"
            style={{ transform: "translateZ(22px)" }}
          >
            <p className="font-serif text-4xl font-semibold leading-none tabular-nums">
              {value === null ? (
                <span className="inline-block h-9 w-12 animate-pulse rounded-lg bg-muted" />
              ) : (
                <CountUp to={value} />
              )}
            </p>

            <p className="mt-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}{" "}
              <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
            </p>
          </div>
        </motion.div>
      </Link>
    </motion.li>
  );
}

function Card({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: "spring", stiffness: 90, damping: 18 }}
      className={`rounded-3xl border border-border bg-card/90 p-5 shadow-lg backdrop-blur sm:p-6 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">{title}</h2>
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
          >
            {action.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {children}
    </motion.section>
  );
}

function Donut({
  parts,
  total,
}: {
  parts: { label: string; value: number; color: string }[];
  total: number;
}) {
  const R = 52;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-36 w-36 shrink-0">
        <svg
          viewBox="0 0 140 140"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label={parts.map((p) => `${p.label}: ${p.value}`).join(", ")}
        >
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="16"
          />

          {total > 0 &&
            parts.map((p, i) => {
              const len = (p.value / total) * C;
              const el = (
                <motion.circle
                  key={p.label}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={p.color}
                  strokeWidth="16"
                  strokeLinecap="butt"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                />
              );
              offset += len;
              return el;
            })}
        </svg>

        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-serif text-3xl font-semibold leading-none">
              {total}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </p>
          </div>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {parts.map((p) => (
          <li
            key={p.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: p.color }}
              />
              {p.label}
            </span>
            <span className="font-semibold tabular-nums">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignupBars({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div
      className="flex h-44 items-end gap-3 sm:gap-4"
      role="img"
      aria-label={data.map((d) => `${d.label}: ${d.value}`).join(", ")}
    >
      {data.map((d, i) => (
        <div
          key={d.label}
          className="flex h-full flex-1 flex-col items-center justify-end gap-2"
        >
          <span className="text-xs font-semibold tabular-nums">{d.value}</span>

          <motion.div
            initial={{ height: 0 }}
            whileInView={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 70,
              damping: 15,
              delay: i * 0.08,
            }}
            className="w-full max-w-12 rounded-t-xl bg-linear-to-t from-(--logo-from) to-(--logo-to) shadow-lg shadow-brand/20"
            style={{ opacity: d.value ? 1 : 0.35 }}
          />

          <span className="text-[11px] font-medium text-muted-foreground">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminOverview() {
  const { user } = useAdminUser();
  const u = useUsers();
  const s = useServices();
  const t = useTransactions();
  const error = u.error || s.error || t.error;
  const reloadAll = () => {
    u.reload();
    s.reload();
    t.reload();
  };

  const stats = useMemo(() => {
    const users = u.users;
    const services = s.services;
    const tx = t.transactions;
    const byStatus: Record<ServiceStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    services?.forEach((x) => byStatus[x.status]++);

    const months = Array.from({ length: 6 }, (_, k) => {
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      d.setMonth(d.getMonth() - (5 - k));

      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-GB", { month: "short" }),
        value: 0,
      };
    });

    users?.forEach((x) => {
      const d = new Date(x.createdAt);
      const m = months.find(
        (mm) => mm.key === `${d.getFullYear()}-${d.getMonth()}`,
      );
      if (m) m.value++;
    });

    return {
      users: users?.length ?? null,
      vendors: users ? users.filter((x) => x.role === "vendor").length : null,
      customers: users
        ? users.filter((x) => x.role === "customer").length
        : null,
      admins: users ? users.filter((x) => x.role === "admin").length : 0,
      services: services?.length ?? null,
      pending: services ? byStatus.pending : null,
      transactions: tx?.length ?? null,
      byStatus,
      months,
      queue: services?.filter((x) => x.status === "pending").slice(0, 4) ?? [],
      latest: tx?.slice(0, 5) ?? [],
    };
  }, [u.users, s.services, t.transactions]);

  const loading = !error && (!u.users || !s.services || !t.transactions);
  const first = user?.name?.split(" ")[0];

  return (
    <div>
      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 16 }}
        className="relative mb-8 overflow-hidden rounded-4xl bg-linear-to-br from-[oklch(0.28_0.09_285)] via-[oklch(0.34_0.13_320)] to-[oklch(0.42_0.16_350)] p-7 text-white shadow-2xl shadow-brand/20 sm:p-10"
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[24px_24px]" />

        <div className="relative flex items-center justify-between gap-6 perspective:[900px]">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/70">
              Admin dashboard
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-5xl">
              {first ? `Welcome back, ${first}` : "Welcome back"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Everything happening on WedPlan at a glance: who has joined, what
              is waiting for review and how Premium payments are going.
            </p>

            {stats.pending !== null && stats.pending > 0 && (
              <Link
                href="/dashboard/admin/services"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-xl transition hover:scale-105"
              >
                <Clock className="h-4 w-4" /> Review {stats.pending} pending{" "}
                {stats.pending === 1 ? "service" : "services"}{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div
            aria-hidden
            className="relative hidden h-40 w-48 shrink-0 md:block"
          >
            {[Users, Store, CreditCard].map((I, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -12, 0], rotate: [0, 6, 0] }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.6,
                }}
                style={{ z: 40 + i * 30 }}
                className={`absolute grid h-16 w-16 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-xl backdrop-blur-md ${["left-0 top-2", "right-2 top-0", "left-14 bottom-0"][i]}`}
              >
                <I className="h-7 w-7" />
              </motion.span>
            ))}
          </div>
        </div>
      </motion.header>

      {error ? (
        <LoadError message={error} onRetry={reloadAll} />
      ) : (
        <>
          <ul
            className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:gap-5"
            aria-label="Platform totals"
          >
            <Tile
              index={0}
              icon={Users}
              label="Registered users"
              value={stats.users}
              href="/dashboard/admin/users"
              from="oklch(0.7 0.16 305)"
              to="oklch(0.45 0.2 285)"
            />

            <Tile
              index={1}
              icon={Store}
              label="Vendors"
              value={stats.vendors}
              href="/dashboard/admin/users"
              from="oklch(0.84 0.13 80)"
              to="oklch(0.62 0.17 50)"
            />

            <Tile
              index={2}
              icon={UserRound}
              label="Customers"
              value={stats.customers}
              href="/dashboard/admin/users"
              from="oklch(0.78 0.16 350)"
              to="oklch(0.5 0.22 335)"
            />

            <Tile
              index={3}
              icon={BadgeCheck}
              label="Total services"
              value={stats.services}
              href="/dashboard/admin/services"
              from="oklch(0.76 0.14 155)"
              to="oklch(0.48 0.12 180)"
            />

            <Tile
              index={4}
              icon={Clock}
              label="Pending services"
              value={stats.pending}
              href="/dashboard/admin/services"
              from="oklch(0.74 0.15 28)"
              to="oklch(0.5 0.21 10)"
              alert
            />

            <Tile
              index={5}
              icon={Receipt}
              label="Transactions"
              value={stats.transactions}
              href="/dashboard/admin/transactions"
              from="oklch(0.72 0.14 230)"
              to="oklch(0.46 0.16 255)"
            />
          </ul>

          {loading ? (
            <div
              className="mt-8 grid gap-6 lg:grid-cols-2"
              role="status"
              aria-label="Loading dashboard data"
            >
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <Card
                title="Waiting for review"
                action={{
                  href: "/dashboard/admin/services",
                  label: "Manage services",
                }}
              >
                {stats.queue.length === 0 ? (
                  <EmptyState
                    icon={ShieldCheck}
                    title="All caught up"
                    text="No services are waiting for review right now."
                  />
                ) : (
                  <ul className="space-y-3">
                    {stats.queue.map((x, i) => (
                      <motion.li
                        key={x.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                      >
                        <Link
                          href="/dashboard/admin/services"
                          className="flex items-center gap-3.5 rounded-2xl border border-border bg-background p-3 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg"
                        >
                          <span className="h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                            {x.images[0] && (
                              <Image
                                src={x.images[0]}
                                alt=""
                                width={64}
                                height={56}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {x.name}
                            </span>

                            <span className="block truncate text-xs text-muted-foreground">
                              {x.vendor?.businessName ||
                                x.vendor?.name ||
                                "Unknown vendor"}{" "}
                              · {money(x.price)}
                            </span>
                          </span>

                          <span className="shrink-0 rounded-full bg-gold/25 px-3 py-1 text-[11px] font-semibold">
                            Review
                          </span>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card title="Users by role">
                <Donut
                  total={stats.users ?? 0}
                  parts={[
                    {
                      label: ROLE_META.customer.plural,
                      value: stats.customers ?? 0,
                      color: ROLE_META.customer.to,
                    },
                    {
                      label: ROLE_META.vendor.plural,
                      value: stats.vendors ?? 0,
                      color: ROLE_META.vendor.to,
                    },
                    {
                      label: ROLE_META.admin.plural,
                      value: stats.admins,
                      color: ROLE_META.admin.from,
                    },
                  ]}
                />
              </Card>

              <Card title="New sign-ups, last 6 months">
                <SignupBars data={stats.months} />
              </Card>

              <Card
                title="Services by status"
                action={{ href: "/dashboard/admin/services", label: "Open" }}
              >
                <ul className="space-y-4">
                  {(Object.keys(SERVICE_STATUS) as ServiceStatus[]).map(
                    (k, i) => {
                      const m = SERVICE_STATUS[k];
                      const n = stats.byStatus[k];
                      const pct = stats.services
                        ? (n / stats.services) * 100
                        : 0;

                      return (
                        <li key={k}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 font-medium">
                              <m.icon className="h-4 w-4" /> {m.label}
                            </span>
                            <span className="font-semibold tabular-nums">
                              {n}
                            </span>
                          </div>

                          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${pct}%` }}
                              viewport={{ once: true }}
                              transition={{
                                type: "spring",
                                stiffness: 70,
                                damping: 16,
                                delay: i * 0.1,
                              }}
                              className="h-full rounded-full"
                              style={{
                                backgroundImage: `linear-gradient(90deg, ${m.from}, ${m.to})`,
                              }}
                            />
                          </div>
                        </li>
                      );
                    },
                  )}
                </ul>
              </Card>

              <Card
                title="Latest transactions"
                action={{
                  href: "/dashboard/admin/transactions",
                  label: "View all",
                }}
                className="lg:col-span-2"
              >
                {stats.latest.length === 0 ? (
                  <EmptyState
                    icon={CreditCard}
                    title="No payments yet"
                    text="Premium upgrades will show up here once vendors pay through Stripe."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {stats.latest.map((x) => (
                      <li
                        key={x.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
                      >
                        <Avatar
                          src={x.vendor?.image}
                          name={x.vendor?.name ?? "?"}
                          size={38}
                        />

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {x.vendor?.businessName ||
                              x.vendor?.name ||
                              "Unknown vendor"}
                          </span>

                          <span className="block text-xs capitalize text-muted-foreground">
                            {x.plan} plan · {formatDate(x.createdAt)}
                          </span>
                        </span>

                        <span className="font-serif text-lg font-semibold">
                          {formatAmount(x.amount, x.currency)}
                        </span>

                        <TxStatusBadge status={x.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
