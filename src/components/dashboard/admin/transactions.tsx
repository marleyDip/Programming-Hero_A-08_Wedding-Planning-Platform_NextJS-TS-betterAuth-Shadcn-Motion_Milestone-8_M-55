"use client";

/**
 * WedPlan - Admin: Transactions
 * Place at: components/dashboard/admin/transactions.tsx
 * Used by: app/dashboard/admin/transactions/page.tsx
 *
 * READ-ONLY. Shows vendor, plan, amount, payment status and date. There are deliberately no edit,
 * "mark as paid" or delete controls: records are written only by the server's verified Stripe webhook,
 * and the server must reject any admin write to the transactions collection.
 */

import {
  EmptyState,
  LoadError,
  Skeleton,
  TxStatusBadge,
  fieldCls,
  formatAmount,
  isPaid,
  txTone,
  useTransactions,
  type TxTone,
} from "@/components/dashboard/admin/admin-shared";
import {
  Avatar,
  Modal,
  PageHeader,
  formatDate,
} from "@/components/dashboard/customer/customer-shared";
import { CountUp, useTilt } from "@/components/home/section-kit";
import FancySelect, { type SelectOption } from "@/components/ui/fancy-select";

import type { AdminTransaction } from "@/lib/admin-api";

import { motion } from "framer-motion";
import {
  ArrowDownWideNarrow,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Crown,
  LockKeyhole,
  Receipt,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Tab = "all" | TxTone;
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "success", label: "Successful" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
];

const sortOptions: SelectOption[] = [
  {
    value: "new",
    label: "Newest first",
  },
  {
    value: "old",
    label: "Oldest first",
  },
  {
    value: "high",
    label: "Highest amount",
  },
];

const PAGE = 10;

const dateTime = (s: string) =>
  new Date(s).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function Tile({
  icon: Icon,
  label,
  children,
  from,
  to,
  index,
}: {
  icon: typeof Receipt;
  label: string;
  children: React.ReactNode;
  from: string;
  to: string;
  index: number;
}) {
  const { ref, reduce, style, glare, handlers } = useTilt(9, 18);

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 36, rotateX: -22 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        type: "spring",
        stiffness: 90,
        damping: 15,
        delay: index * 0.07,
      }}
      className="perspective-[1000px]"
    >
      <motion.div
        ref={ref}
        {...handlers}
        style={style}
        className="relative h-full overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-lg transition-shadow hover:shadow-2xl hover:shadow-brand/20"
      >
        <motion.div
          aria-hidden
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        />

        <span
          className="relative grid h-11 w-11 place-items-center rounded-2xl text-white shadow-lg"
          style={{
            transform: "translateZ(30px)",
            backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
          }}
        >
          <Icon className="h-5 w-5" />
        </span>

        <div
          className="relative mt-4"
          style={{ transform: "translateZ(20px)" }}
        >
          <p className="font-serif text-3xl font-semibold leading-none">
            {children}
          </p>
          <p className="mt-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        </div>
      </motion.div>
    </motion.li>
  );
}

function VendorCell({ t }: { t: AdminTransaction }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar src={t.vendor?.image} name={t.vendor?.name ?? "?"} size={38} />

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {t.vendor?.businessName || t.vendor?.name || "Unknown vendor"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {t.vendor?.email || t.vendorId}
        </p>
      </div>
    </div>
  );
}

const PlanChip = ({ plan }: { plan: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/25 px-3 py-1.5 text-xs font-semibold capitalize">
    <Crown className="h-3.5 w-3.5" /> {plan}
  </span>
);

function copy(text: string, what: string) {
  navigator.clipboard?.writeText(text).then(
    () => toast.success(`${what} copied`),
    () => toast.error("Couldn't copy"),
  );
}

function DetailsDialog({
  t,
  onClose,
}: {
  t: AdminTransaction | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!t} onClose={onClose} label="Transaction details">
      {t && (
        <div>
          <div className="relative overflow-hidden bg-linear-to-br from-[oklch(0.3_0.1_320)] via-[oklch(0.36_0.14_345)] to-[oklch(0.42_0.16_10)] px-6 pb-6 pt-8 text-white sm:px-8">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[20px_20px]" />

            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Payment amount
              </p>
              <p className="mt-1 font-serif text-4xl font-semibold">
                {formatAmount(t.amount, t.currency)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TxStatusBadge
                  status={t.status}
                  className="bg-white/95! !text-neutral-900!"
                />

                <PlanChip plan={t.plan} />
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 sm:p-8">
            <div className="rounded-2xl border border-border p-3.5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Vendor
              </p>
              <VendorCell t={t} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/50 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  {dateTime(t.createdAt)}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/50 p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Currency
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  {t.currency.toUpperCase()}
                </p>
              </div>
            </div>

            {(
              [
                ["Stripe session", t.stripeSessionId],
                ["Stripe subscription", t.stripeSubscriptionId ?? ""],
              ] as const
            ).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 p-3.5"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {k}
                  </p>
                  <p className="break-all font-mono text-xs">{v || "—"}</p>
                </div>

                {v && (
                  <button
                    type="button"
                    onClick={() => copy(v, k)}
                    aria-label={`Copy ${k}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card hover:bg-brand-soft"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <p className="flex items-start gap-2 rounded-2xl bg-muted/60 p-3.5 text-xs leading-relaxed text-muted-foreground">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /> This record is
              read-only. It is created by Stripe&apos;s verified webhook, so it
              can&apos;t be edited or marked as paid from the dashboard.
            </p>
          </div>

          <div className="flex justify-end border-t border-border bg-muted/30 px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold hover:bg-accent"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Transactions() {
  const { transactions, error, reload } = useTransactions();

  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");
  const [shown, setShown] = useState(PAGE);
  const [viewing, setViewing] = useState<AdminTransaction | null>(null);

  const stats = useMemo(() => {
    const rows = transactions ?? [];
    const revenue = new Map<string, number>();
    rows
      .filter((t) => isPaid(t.status))
      .forEach((t) =>
        revenue.set(t.currency, (revenue.get(t.currency) ?? 0) + t.amount),
      );

    return {
      total: rows.length,
      paid: rows.filter((t) => txTone(t.status) === "success").length,
      open: rows.filter((t) => ["pending", "failed"].includes(txTone(t.status)))
        .length,
      revenue: [...revenue.entries()].map(([c, a]) => formatAmount(a, c)),
    };
  }, [transactions]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      all: transactions?.length ?? 0,
      success: 0,
      pending: 0,
      failed: 0,
      neutral: 0,
    };

    transactions?.forEach((t) => c[txTone(t.status)]++);
    return c;
  }, [transactions]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();

    const rows = (transactions ?? []).filter(
      (t) =>
        (tab === "all" || txTone(t.status) === tab) &&
        (!term ||
          [
            t.vendor?.name,
            t.vendor?.businessName,
            t.vendor?.email,
            t.stripeSessionId,
          ].some((v) => (v ?? "").toLowerCase().includes(term))),
    );

    if (sort === "old")
      rows.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    else if (sort === "high") rows.sort((a, b) => b.amount - a.amount);

    return rows;
  }, [transactions, tab, q, sort]);

  const visible = list.slice(0, shown);

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Transactions"
        subtitle="Every Premium subscription payment on WedPlan. Records come straight from Stripe and can't be edited."
      />

      <ul
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
        aria-label="Transaction summary"
      >
        <Tile
          index={0}
          icon={Receipt}
          label="Total transactions"
          from="oklch(0.7 0.16 305)"
          to="oklch(0.45 0.2 285)"
        >
          {transactions ? <CountUp to={stats.total} /> : "–"}
        </Tile>

        <Tile
          index={1}
          icon={CheckCircle2}
          label="Successful"
          from="oklch(0.78 0.15 160)"
          to="oklch(0.52 0.12 180)"
        >
          {transactions ? <CountUp to={stats.paid} /> : "–"}
        </Tile>

        <Tile
          index={2}
          icon={Clock}
          label="Pending or failed"
          from="oklch(0.84 0.13 80)"
          to="oklch(0.62 0.17 50)"
        >
          {transactions ? <CountUp to={stats.open} /> : "–"}
        </Tile>

        <Tile
          index={3}
          icon={Wallet}
          label="Revenue (paid only)"
          from="oklch(0.78 0.16 350)"
          to="oklch(0.5 0.22 335)"
        >
          {transactions ? (
            <span className="text-2xl">
              {stats.revenue.length ? stats.revenue.join(" + ") : "0"}
            </span>
          ) : (
            "-"
          )}
        </Tile>
      </ul>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Filter by payment status"
          className="flex gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1.5 scrollbar-none"
        >
          {TABS.map((t) => {
            const on = tab === t.key;

            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={on}
                type="button"
                onClick={() => {
                  setTab(t.key);
                  setShown(PAGE);
                }}
                className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${on ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                {on && (
                  <motion.span
                    layoutId="tx-tab"
                    className="absolute inset-0 rounded-full bg-linear-to-r from-(--logo-from) to-brand shadow-md shadow-brand/30"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}

                <span className="relative">
                  {t.label}{" "}
                  <span className="ml-1 text-xs opacity-80">
                    {transactions ? counts[t.key] : "-"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:w-136">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setShown(PAGE);
              }}
              placeholder="Search vendor, email or session ID"
              aria-label="Search transactions"
              className={`${fieldCls()} h-14! w-full rounded-2xl! py-0! pl-11 pr-10`}
              // className={`${fieldCls()} rounded-full! py-3! pl-11 pr-10`}
            />

            {q && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="w-full shrink-0 sm:w-44">
            <FancySelect
              value={sort}
              onChange={(value) => {
                setSort(value);
                setShown(PAGE);
              }}
              options={sortOptions}
              icon={ArrowDownWideNarrow}
              className="w-full"
            />
          </div>

          {/* <FancySelect
            // label="Sort transactions"
            value={sort}
            onChange={setSort}
            options={sortOptions}
            icon={ArrowDownWideNarrow}
            className="py-3! sm:w-44"
          /> */}

          {/* <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort transactions"
            className={`${fieldCls()} rounded-full! py-3! sm:w-44`}
          >
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
            <option value="high">Highest amount</option>
          </select> */}
        </div>
      </div>

      {error ? (
        <LoadError message={error} onRetry={reload} />
      ) : !transactions ? (
        <div
          className="space-y-3"
          role="status"
          aria-label="Loading transactions"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No transactions found"
          text={
            transactions.length === 0
              ? "Payments will appear here after a vendor upgrades to Premium."
              : "Nothing matches these filters."
          }
        >
          {(q || tab !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setTab("all");
              }}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground"
            >
              Clear filters
            </button>
          )}
        </EmptyState>
      ) : (
        <>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
            <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_1fr_1.2fr_1.3fr_auto] gap-4 border-b border-border bg-muted/40 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:grid">
              <span>Vendor</span>
              <span>Plan</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Date</span>
              <span className="w-16" />
            </div>

            <ul className="divide-y divide-border">
              {visible.map((t, i) => (
                <motion.li
                  key={t.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: Math.min(i, 8) * 0.04,
                    type: "spring",
                    stiffness: 140,
                    damping: 20,
                  }}
                  className="grid cursor-pointer transition-colors hover:bg-muted/50 gap-3 px-5 py-4 md:grid-cols-[minmax(0,2.2fr)_1fr_1fr_1.2fr_1.3fr_auto] md:items-center md:gap-4 md:px-6"
                  onClick={() => setViewing(t)}
                >
                  <VendorCell t={t} />

                  <div className="flex items-center justify-between md:block">
                    <span className="text-xs text-muted-foreground md:hidden">
                      Plan
                    </span>
                    <PlanChip plan={t.plan} />
                  </div>

                  <div className="flex items-center justify-between md:block">
                    <span className="text-xs text-muted-foreground md:hidden">
                      Amount
                    </span>
                    <span className="font-serif text-lg font-semibold">
                      {formatAmount(t.amount, t.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between md:block">
                    <span className="text-xs text-muted-foreground md:hidden">
                      Status
                    </span>
                    <TxStatusBadge status={t.status} />
                  </div>

                  <div className="flex items-center justify-between gap-1.5 text-sm text-muted-foreground md:justify-start">
                    <span className="text-xs md:hidden">Date</span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="hidden h-3.5 w-3.5 md:block" />{" "}
                      {formatDate(t.createdAt)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewing(t);
                    }}
                    className="w-full rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold hover:border-brand/50 hover:bg-brand-soft md:w-16"
                  >
                    View
                  </button>
                </motion.li>
              ))}
            </ul>
          </div>

          <p
            className="mt-6 text-center text-xs text-muted-foreground"
            aria-live="polite"
          >
            Showing {visible.length} of {list.length}
          </p>

          {list.length > shown && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShown((n) => n + PAGE)}
                className="rounded-full border border-border bg-card px-7 py-3 text-sm font-semibold hover:border-brand/50 hover:bg-brand-soft"
              >
                Show more
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-8 flex items-start gap-2 rounded-2xl border border-border bg-card/70 p-4 text-xs leading-relaxed text-muted-foreground">
        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /> Payment records are
        read-only. Admins can&apos;t create, edit or delete them, so an
        unsuccessful payment can never be marked as successful by hand.
      </p>

      <DetailsDialog t={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
