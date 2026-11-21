"use client";

/**
 * WedPlan - Vendor Subscription
 * Place at: components/dashboard/vendor/subscription.tsx
 * Used by: app/dashboard/vendor/subscription/page.tsx
 *
 * Plans (from the assignment)
 *   Free:    max 3 active services, basic vendor dashboard, booking request management
 *   Premium: unlimited active services, Premium Vendor badge, all Free features
 * "Upgrade to Premium" asks YOUR SERVER for a Stripe Checkout session (test mode) and redirects to it.
 * Premium is never activated here: the server turns it on ONLY after a verified Stripe webhook event.
 * "Refresh status" re-reads the account (bypassing the cookie cache) in case the webhook just fired.
 *
 * Optional env: NEXT_PUBLIC_PREMIUM_PRICE_LABEL (e.g. "৳999 / month"). Nothing is shown if unset.
 */

import {
  PageHeader,
  formatDate,
} from "@/components/dashboard/customer/customer-shared";
import {
  FREE_LIMIT,
  PremiumBadge,
  activeCount,
  isPremium,
  useVendorServices,
  useVendorUser,
} from "@/components/dashboard/vendor/vendor-shared";
import { useTilt } from "@/components/home/section-kit";
import { authClient } from "@/lib/auth-client";
import { ApiError, startPremiumCheckout } from "@/lib/vendor-api";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  CreditCard,
  Crown,
  Infinity as InfinityIcon,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PRICE_LABEL = process.env.NEXT_PUBLIC_PREMIUM_PRICE_LABEL;

const FREE_FEATURES = [
  `Maximum ${FREE_LIMIT} active services`,
  "Basic vendor dashboard",
  "Booking request management",
];
const PREMIUM_FEATURES = [
  "Unlimited active services",
  "Premium Vendor badge on your listings",
  "All Free plan features",
];

function PlanCard({
  premium,
  current,
  children,
}: {
  premium?: boolean;
  current: boolean;
  children: React.ReactNode;
}) {
  const { ref, reduce, style, glare, sx, sy, handlers } = useTilt(
    premium ? 9 : 7,
    22,
  );

  const features = premium ? PREMIUM_FEATURES : FREE_FEATURES;

  return (
    <div className="perspective:[1500px]">
      <motion.article
        ref={ref}
        {...handlers}
        style={style}
        initial={reduce ? false : { opacity: 0, y: 50, rotateX: -18 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{
          type: "spring",
          stiffness: 90,
          damping: 16,
          delay: premium ? 0.15 : 0,
        }}
        className={`relative h-full overflow-hidden rounded-4xl border p-7 shadow-2xl sm:p-8 ${premium ? "border-transparent bg-linear-to-br from-[oklch(0.3_0.1_320)] via-[oklch(0.36_0.14_345)] to-[oklch(0.42_0.16_10)] text-white shadow-brand/30" : "border-border bg-card shadow-black/10"}`}
      >
        {premium && (
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] bg-size-[22px_22px]" />
        )}
        <motion.div
          aria-hidden
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        />

        {premium && (
          <motion.div
            aria-hidden
            style={{ x: sx, y: sy, transform: "translateZ(80px)" }}
            className="pointer-events-none absolute -right-6 -top-6 text-[oklch(0.85_0.14_85)]/20"
          >
            <Crown className="h-48 w-48" strokeWidth={0.8} />
          </motion.div>
        )}

        <div className="relative" style={{ transform: "translateZ(30px)" }}>
          <div className="flex items-start justify-between gap-3">
            <span
              className={`grid h-14 w-14 place-items-center rounded-2xl shadow-xl ${premium ? "bg-linear-to-br from-[oklch(0.88_0.14_85)] to-[oklch(0.7_0.16_55)] text-neutral-900" : "bg-brand-soft text-brand"}`}
            >
              {premium ? (
                <motion.span
                  animate={
                    reduce
                      ? undefined
                      : { rotate: [0, -10, 10, 0], y: [0, -3, 0] }
                  }
                  transition={{ duration: 3.5, repeat: Infinity }}
                >
                  <Crown className="h-7 w-7" />
                </motion.span>
              ) : (
                <Zap className="h-7 w-7" />
              )}
            </span>

            {current && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${premium ? "bg-white/20 text-white" : "bg-success/15 text-success"}`}
              >
                <BadgeCheck className="h-3.5 w-3.5" /> Current plan
              </span>
            )}
          </div>

          <h3 className="mt-5 font-serif text-3xl font-semibold">
            {premium ? "Premium" : "Free"}
          </h3>
          <p
            className={`mt-1 text-sm ${premium ? "text-white/75" : "text-muted-foreground"}`}
          >
            {premium
              ? "For vendors who want to grow without limits."
              : "Everything you need to get started."}
          </p>

          {premium && PRICE_LABEL && (
            <p className="mt-4 font-serif text-3xl font-bold text-[oklch(0.88_0.14_85)]">
              {PRICE_LABEL}
            </p>
          )}

          {!premium && (
            <p className="mt-4 font-serif text-3xl font-bold">No cost</p>
          )}

          <ul className="mt-6 space-y-3.5">
            {features.map((f, i) => (
              <motion.li
                key={f}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.09 }}
                className="flex items-start gap-3 text-sm font-medium"
              >
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${premium ? "bg-[oklch(0.88_0.14_85)] text-neutral-900" : "bg-success text-white"}`}
                >
                  <Check className="h-3 w-3" strokeWidth={3.5} />
                </span>
                {f}
              </motion.li>
            ))}
          </ul>

          <div className="mt-8" style={{ transform: "translateZ(30px)" }}>
            {children}
          </div>
        </div>
      </motion.article>
    </div>
  );
}

export default function Subscription() {
  const reduce = useReducedMotion();

  const { user, refetch } = useVendorUser();
  const premium = isPremium(user);
  const { services } = useVendorServices(user?.id);

  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const used = services ? activeCount(services) : null;
  const expired = user?.subscriptionPlan === "premium" && !premium;

  const upgrade = async () => {
    setBusy(true);

    try {
      const url = await startPremiumCheckout();
      toast.loading("Redirecting to secure checkout…", { id: "checkout" });
      window.location.assign(url);
    } catch (e) {
      toast.error("Couldn't start checkout", {
        id: "checkout",
        description:
          e instanceof ApiError && e.status === 403
            ? "Only vendors can upgrade."
            : "Please try again in a moment.",
      });
      setBusy(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);

    try {
      // bypass the 5 minute cookie cache so a fresh webhook update shows up
      await authClient.getSession({ query: { disableCookieCache: true } });
      await refetch?.();
      toast.success("Account refreshed");
    } catch {
      toast.error("Couldn't refresh your account");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Plans & billing"
        title="Subscription"
        subtitle="Choose the plan that fits your business. Upgrade any time to publish unlimited services."
      >
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-brand/50 hover:bg-brand-soft disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />{" "}
          Refresh status
        </button>
      </PageHeader>

      {/* current plan banner */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-center gap-5 rounded-3xl border border-border bg-card/90 p-5 shadow-lg backdrop-blur sm:p-6"
      >
        <span
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-lg ${premium ? "bg-linear-to-br from-[oklch(0.88_0.14_85)] to-[oklch(0.7_0.16_55)] text-neutral-900" : "bg-brand-soft text-brand"}`}
        >
          {premium ? (
            <Crown className="h-7 w-7" />
          ) : (
            <Sparkles className="h-7 w-7" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            Your current plan {premium && <PremiumBadge />}
          </p>
          <p className="font-serif text-2xl font-semibold">
            {premium ? "Premium" : "Free"}
          </p>

          {premium && user?.subscriptionExpiresAt && (
            <p className="text-xs text-muted-foreground">
              Active until {formatDate(user.subscriptionExpiresAt)}
            </p>
          )}

          {expired && (
            <p className="text-xs font-medium text-destructive">
              Your Premium plan has expired. Upgrade again to restore unlimited
              services.
            </p>
          )}
        </div>

        <div className="w-full sm:w-64">
          {premium ? (
            <p className="flex items-center gap-2 text-sm font-semibold">
              <InfinityIcon className="h-5 w-5 text-brand" /> {used ?? "–"}{" "}
              active, no limit
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold">Active services</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {used ?? "–"} / {FREE_LIMIT}
                </span>
              </div>

              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, ((used ?? 0) / FREE_LIMIT) * 100)}%`,
                  }}
                  transition={{ type: "spring", stiffness: 70, damping: 16 }}
                  className={`h-full rounded-full ${(used ?? 0) >= FREE_LIMIT ? "bg-destructive" : "bg-linear-to-r from-(--logo-from) to-(--logo-to)"}`}
                />
              </div>
            </>
          )}
        </div>
      </motion.section>

      {/* plans */}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <PlanCard current={!premium}>
          <div
            className={`rounded-full border px-6 py-3.5 text-center text-sm font-semibold ${!premium ? "border-success/40 bg-success/10 text-success" : "border-border text-muted-foreground"}`}
          >
            {!premium ? "You're on this plan" : "Included in Premium"}
          </div>
        </PlanCard>

        <PlanCard premium current={premium}>
          {premium ? (
            <div className="flex items-center justify-center gap-2 rounded-full bg-white/15 px-6 py-3.5 text-sm font-semibold backdrop-blur">
              <BadgeCheck className="h-4 w-4" /> Premium is active
            </div>
          ) : (
            <motion.button
              type="button"
              onClick={upgrade}
              disabled={busy}
              whileHover={busy ? undefined : { scale: 1.04 }}
              whileTap={busy ? undefined : { scale: 0.96 }}
              className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-linear-to-r from-[oklch(0.9_0.14_88)] to-[oklch(0.75_0.16_60)] px-6 py-4 text-base font-bold text-neutral-900 shadow-2xl shadow-black/30 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/50"
                  initial={{ left: "-40%" }}
                  animate={{ left: "140%" }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    repeatDelay: 2.2,
                    ease: "easeInOut",
                  }}
                />
              )}

              {busy ? (
                <>
                  <Loader2 className="relative h-5 w-5 animate-spin" />{" "}
                  <span className="relative">Opening checkout…</span>
                </>
              ) : (
                <>
                  <Crown className="relative h-5 w-5" />{" "}
                  <span className="relative">Upgrade to Premium</span>
                </>
              )}
            </motion.button>
          )}
        </PlanCard>
      </div>

      {/* comparison */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        className="mt-10 overflow-hidden rounded-3xl border border-border bg-card/90 shadow-lg"
      >
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-serif text-xl font-semibold">Compare plans</h2>
        </div>

        <div className="divide-y divide-border text-sm">
          {[
            ["Active services", `${FREE_LIMIT} maximum`, "Unlimited"],
            ["Premium Vendor badge", false, true],
            ["Booking request management", true, true],
            ["Basic vendor dashboard", true, true],
          ].map(([label, free, prem]) => (
            <div
              key={String(label)}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-6 py-3.5 sm:grid-cols-[1fr_9rem_9rem]"
            >
              <span className="font-medium">{label}</span>
              {[free, prem].map((v, i) => (
                <span key={i} className="flex justify-center">
                  {v === true ? (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-success/15 text-success">
                      <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                    </span>
                  ) : v === false ? (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-muted-foreground">
                      <X className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="text-xs font-semibold">{String(v)}</span>
                  )}
                </span>
              ))}
            </div>
          ))}

          <div className="grid grid-cols-[1fr_auto_auto] gap-4 bg-muted/40 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:grid-cols-[1fr_9rem_9rem]">
            <span /> <span className="text-center">Free</span>{" "}
            <span className="text-center">Premium</span>
          </div>
        </div>
      </motion.section>

      {/* trust */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            I: CreditCard,
            t: "Secure Stripe Checkout",
            d: "You pay on Stripe's hosted page (test mode). WedPlan never sees your card details.",
          },
          {
            I: ShieldCheck,
            t: "Verified activation",
            d: "Premium switches on only after Stripe confirms your payment to our server.",
          },
          {
            I: LockKeyhole,
            t: "Only for your account",
            d: "A checkout session is created for the vendor who is signed in, and nobody else.",
          },
        ].map(({ I, t, d }, i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="rounded-3xl border border-border bg-card/80 p-5"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
              <I className="h-5 w-5" />
            </span>

            <p className="mt-3 text-sm font-semibold">{t}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {d}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
