"use client";

/**
 * WedPlan - Why Choose WedPlan
 * Place at: components/home/why-choose.tsx   (needs section-kit.tsx + lib/services-api.ts)
 *
 * Left: heading, CTA and live platform numbers from the API (live services, active vendors,
 * cities, categories: approved + active only, so nothing is invented).
 * Right: six benefit cards with 3D tilt, glare and layered depth.
 */

import { getPlatformStats, type PlatformStats } from "@/lib/services-api";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  LayoutDashboard,
  LayoutGrid,
  ShieldCheck,
  Smile,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CountUp,
  SectionBackdrop,
  SectionHeading,
  useTilt,
} from "./section-kit";

const BENEFITS: {
  icon: LucideIcon;
  title: string;
  text: string;
  from: string;
  to: string;
}[] = [
  {
    icon: ShieldCheck,
    title: "Verified vendors",
    text: "Every service is reviewed and approved by our team before it goes live.",
    from: "oklch(0.72 0.15 160)",
    to: "oklch(0.5 0.12 180)",
  },
  {
    icon: Wallet,
    title: "Transparent pricing",
    text: "See prices upfront and compare services side by side, with no hidden surprises.",
    from: "oklch(0.84 0.13 80)",
    to: "oklch(0.6 0.17 45)",
  },
  {
    icon: CalendarCheck,
    title: "Easy booking requests",
    text: "Pick your date and location, then send a booking request in just a few clicks.",
    from: "oklch(0.74 0.15 28)",
    to: "oklch(0.52 0.21 10)",
  },
  {
    icon: LayoutDashboard,
    title: "Track every request",
    text: "Follow each booking from pending to confirmed in your personal dashboard.",
    from: "oklch(0.7 0.16 305)",
    to: "oklch(0.46 0.2 285)",
  },
  {
    icon: LayoutGrid,
    title: "Everything in one place",
    text: "Photography, venues, decor, catering, makeup and fashion, all under one roof.",
    from: "oklch(0.72 0.14 230)",
    to: "oklch(0.46 0.16 255)",
  },
  {
    icon: Smile,
    title: "Built for stress-free planning",
    text: "A clean, simple experience designed to save you time and keep planning joyful.",
    from: "oklch(0.78 0.16 350)",
    to: "oklch(0.5 0.22 335)",
  },
];

function BenefitCard({
  b,
  index,
}: {
  b: (typeof BENEFITS)[number];
  index: number;
}) {
  const { ref, reduce, style, glare, sx, sy, handlers } = useTilt(12, 20);
  const Icon = b.icon;

  return (
    <motion.li
      initial={
        reduce ? false : { opacity: 0, y: 60, rotateX: -30, scale: 0.94 }
      }
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        type: "spring",
        stiffness: 85,
        damping: 15,
        delay: (index % 2) * 0.1,
      }}
      style={{ transformOrigin: "50% 100%" }}
    >
      <motion.div
        ref={ref}
        {...handlers}
        whileHover={reduce ? undefined : { y: -8 }}
        style={style}
        className="group relative h-full rounded-3xl border border-border bg-card shadow-lg transition-shadow duration-500 hover:shadow-2xl hover:shadow-brand/20"
      >
        {/* hover tint + glare */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.09]"
            style={{
              background: `linear-gradient(135deg, ${b.from}, ${b.to})`,
            }}
          />

          <motion.div
            aria-hidden
            style={{ background: glare }}
            className="absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100"
          />

          <motion.div
            aria-hidden
            style={{ x: sx, y: sy }}
            className="absolute -bottom-8 -right-8 text-foreground/5 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6"
          >
            <Icon className="h-40 w-40" strokeWidth={1} />
          </motion.div>
        </div>

        <span
          aria-hidden
          className="absolute right-6 top-5 font-serif text-3xl font-bold text-foreground/10"
          style={{ transform: "translateZ(20px)" }}
        >
          0{index + 1}
        </span>

        <div className="relative p-6 transform-3d">
          <div style={{ transform: "translateZ(70px)" }} className="w-fit">
            <motion.span
              whileHover={reduce ? undefined : { rotate: [0, -8, 8, 0] }}
              className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-xl"
              style={{
                background: `linear-gradient(145deg, ${b.from}, ${b.to})`,
                boxShadow: `0 14px 30px -10px ${b.to}`,
              }}
            >
              <Icon className="h-7 w-7" strokeWidth={1.7} />
            </motion.span>
          </div>

          <h3
            className="mt-5 font-serif text-xl font-semibold"
            style={{ transform: "translateZ(40px)" }}
          >
            {b.title}
          </h3>

          <p
            className="mt-2 text-sm leading-relaxed text-muted-foreground"
            style={{ transform: "translateZ(25px)" }}
          >
            {b.text}
          </p>
        </div>
      </motion.div>
    </motion.li>
  );
}

export default function WhyChoose() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();

    getPlatformStats(ctrl.signal)
      .then(setStats)
      .catch(() => undefined); // numbers are optional: the section works without them

    return () => ctrl.abort();
  }, []);

  const tiles = stats
    ? [
        { v: stats.services, k: "Live services" },
        { v: stats.vendors, k: "Active vendors" },
        { v: stats.cities, k: "Cities covered" },
        { v: stats.categories, k: "Categories" },
      ]
    : null;

  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-28">
      <SectionBackdrop />

      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
        {/* left */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              align="left"
              eyebrow="Why choose us"
              words={["Why Choose"]}
              accent="WedPlan?"
              subtitle="We make planning your wedding simpler, clearer and a lot more enjoyable, from the first search to the final confirmation."
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <motion.div
                className="inline-block"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
              >
                <Link
                  href="/services"
                  className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to) px-7 py-3.5 text-sm font-semibold text-(--logo-fg) shadow-lg shadow-brand/30"
                >
                  <motion.span
                    aria-hidden
                    className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/35"
                    initial={{ left: "-40%" }}
                    animate={{ left: "140%" }}
                    transition={{
                      duration: 1.3,
                      repeat: Infinity,
                      repeatDelay: 2.5,
                      ease: "easeInOut",
                    }}
                  />

                  <span className="relative">Explore Wedding Services</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </motion.div>

            {/* live stats */}
            {tiles && (
              <motion.dl
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{
                  hidden: {},
                  show: {
                    transition: { staggerChildren: 0.09, delayChildren: 0.5 },
                  },
                }}
                className="mt-10 grid max-w-md grid-cols-2 gap-3"
              >
                {tiles.map((t) => (
                  <motion.div
                    key={t.k}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.95 },
                      show: { opacity: 1, y: 0, scale: 1 },
                    }}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur"
                  >
                    <dd className="font-serif text-3xl font-semibold text-foreground">
                      <CountUp to={t.v} />
                    </dd>

                    <dt className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
                      {t.k}
                    </dt>
                  </motion.div>
                ))}
              </motion.dl>
            )}
          </div>
        </div>

        {/* right */}
        <ul className="grid gap-5 sm:grid-cols-2 lg:col-span-7 lg:gap-6 perspective-[1500px]">
          {BENEFITS.map((b, i) => (
            <BenefitCard key={b.title} b={b} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}
