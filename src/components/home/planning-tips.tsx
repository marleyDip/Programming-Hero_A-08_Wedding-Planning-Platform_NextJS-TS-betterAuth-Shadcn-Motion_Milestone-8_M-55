"use client";

/**
 * WedPlan - Wedding Planning Tips
 * Place at: components/home/planning-tips.tsx   (needs section-kit.tsx)
 *
 * Self-contained and genuinely useful: six planning tips in a timeline order. Pick a tip and
 * a 3D detail card shows a short checklist the visitor can tick off, with a progress bar and a
 * button that jumps to the matching service category. No API or extra routes needed.
 * Edit TIPS below to change the content.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  Clock,
  Flower2,
  Sparkles,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SectionBackdrop, SectionHeading, useTilt } from "./section-kit";

interface Tip {
  id: string;
  tag: string;
  when: string;
  title: string;
  intro: string;
  points: string[];
  icon: LucideIcon;
  from: string;
  to: string;
  category?: string; // links to /services?category=
  cta: string;
}

const TIPS: Tip[] = [
  {
    id: "budget",
    tag: "Budget",
    when: "12+ months before",
    title: "Set your budget first",
    intro:
      "Your budget shapes every other decision. Decide the total first, then split it by what matters most to you.",
    points: [
      "List your top priorities (venue, photos, food) and give them the biggest share",
      "Keep about 10% aside for surprises and last-minute extras",
      "Compare several services so you know what a fair price looks like",
    ],
    icon: Wallet,
    from: "oklch(0.84 0.13 80)",
    to: "oklch(0.6 0.17 45)",
    cta: "Compare services",
  },
  {
    id: "venue",
    tag: "Venue",
    when: "10-12 months before",
    title: "Lock the venue & date early",
    intro:
      "Great venues book out fast, and the venue often decides your date, guest count and decor options.",
    points: [
      "Visit at least three venues before you decide",
      "Check capacity with a little room to spare for extra guests",
      "Confirm what is included: parking, power backup, decor rules and timings",
    ],
    icon: Building2,
    from: "oklch(0.74 0.15 28)",
    to: "oklch(0.52 0.21 10)",
    category: "Wedding Venues",
    cta: "Browse venues",
  },
  {
    id: "photo",
    tag: "Photography",
    when: "9-10 months before",
    title: "Book your photographer early",
    intro:
      "Photos are what you keep forever. The best photographers and filmmakers fill their calendars well ahead.",
    points: [
      "Look at full galleries, not just highlight reels",
      "Share a shot list and the family photos you want",
      "Confirm delivery time, editing and what the package includes",
    ],
    icon: Camera,
    from: "oklch(0.7 0.16 305)",
    to: "oklch(0.46 0.2 285)",
    category: "Photography & Videography",
    cta: "Find photographers",
  },
  {
    id: "menu",
    tag: "Catering",
    when: "6-8 months before",
    title: "Plan the menu around your guests",
    intro:
      "Food is what guests remember. Build the menu around your headcount, traditions and dietary needs.",
    points: [
      "Confirm your guest count and any dietary requirements",
      "Schedule a tasting before you sign",
      "Plan the serving flow and ask for a few extra portions",
    ],
    icon: UtensilsCrossed,
    from: "oklch(0.76 0.14 155)",
    to: "oklch(0.45 0.12 180)",
    category: "Catering Services",
    cta: "Explore caterers",
  },
  {
    id: "decor",
    tag: "Decor",
    when: "5-7 months before",
    title: "Design a decor theme",
    intro:
      "A clear theme makes every choice easier, from stage and flowers to lighting and invitations.",
    points: [
      "Pick two or three colours and stick to them",
      "Ask decorators for sample stage designs and past work",
      "Check setup time and lighting needs at your venue",
    ],
    icon: Flower2,
    from: "oklch(0.78 0.16 350)",
    to: "oklch(0.5 0.22 335)",
    category: "Decoration & Florist",
    cta: "See decor ideas",
  },
  {
    id: "looks",
    tag: "Style",
    when: "3-5 months before",
    title: "Schedule looks & fittings",
    intro:
      "Feeling great on the day starts with trials and fittings, done early enough to fix anything.",
    points: [
      "Book a makeup and hair trial well before the wedding",
      "Plan at least two outfit fittings",
      "Pack an emergency kit with safety pins, tissues and touch-ups",
    ],
    icon: Sparkles,
    from: "oklch(0.72 0.19 20)",
    to: "oklch(0.46 0.2 0)",
    category: "Makeup & Styling",
    cta: "Book makeup & styling",
  },
];

const href = (t: Tip) =>
  t.category
    ? `/services?category=${encodeURIComponent(t.category)}`
    : "/services";

function DetailCard({
  tip,
  ticked,
  onToggle,
  onNext,
}: {
  tip: Tip;
  ticked: boolean[];
  onToggle: (i: number) => void;
  onNext: () => void;
}) {
  const { ref, reduce, style, glare, sx, sy, handlers } = useTilt(8, 22);
  const Icon = tip.icon;
  const done = ticked.filter(Boolean).length;
  const pct = (done / tip.points.length) * 100;

  return (
    <motion.div
      ref={ref}
      {...handlers}
      style={style}
      className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-brand/10"
    >
      {/* plate decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div
          className="absolute inset-x-0 top-0 h-40 opacity-[0.12]"
          style={{
            background: `linear-gradient(135deg, ${tip.from}, ${tip.to})`,
          }}
        />

        <motion.div
          aria-hidden
          style={{ x: sx, y: sy }}
          className="absolute -right-6 -top-6 text-foreground/6"
        >
          <Icon className="h-56 w-56" strokeWidth={0.9} />
        </motion.div>

        <motion.div
          aria-hidden
          style={{ background: glare }}
          className="absolute inset-0 mix-blend-soft-light"
        />
      </div>

      <div className="relative p-6 sm:p-8 transform-3d">
        <div className="flex items-start justify-between gap-4">
          <div style={{ transform: "translateZ(70px)" }}>
            <motion.span
              animate={reduce ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="grid h-16 w-16 place-items-center rounded-2xl text-white shadow-xl"
              style={{
                background: `linear-gradient(145deg, ${tip.from}, ${tip.to})`,
                boxShadow: `0 16px 34px -10px ${tip.to}`,
              }}
            >
              <Icon className="h-8 w-8" strokeWidth={1.6} />
            </motion.span>
          </div>

          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
            style={{ transform: "translateZ(45px)" }}
          >
            <Clock className="h-3.5 w-3.5 text-brand" /> {tip.when}
          </span>
        </div>

        <h3
          className="mt-6 font-serif text-2xl font-semibold sm:text-3xl"
          style={{ transform: "translateZ(40px)" }}
        >
          {tip.title}
        </h3>

        <p
          className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base"
          style={{ transform: "translateZ(25px)" }}
        >
          {tip.intro}
        </p>

        {/* checklist */}
        <ul
          className="mt-6 space-y-2.5"
          style={{ transform: "translateZ(35px)" }}
        >
          {tip.points.map((p, i) => {
            const on = ticked[i];
            return (
              <motion.li
                key={p}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.12 + i * 0.09,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => onToggle(i)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors duration-300 ${
                    on
                      ? "border-success/40 bg-success/10"
                      : "border-border bg-background/60 hover:border-brand/40 hover:bg-accent/60"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300 ${
                      on
                        ? "border-success bg-success text-white"
                        : "border-border"
                    }`}
                  >
                    <AnimatePresence>
                      {on && (
                        <motion.span
                          initial={{ scale: 0, rotate: -60 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 16,
                          }}
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>

                  <span
                    className={`text-sm leading-relaxed transition-colors ${on ? "text-muted-foreground line-through decoration-success/60" : "text-foreground"}`}
                  >
                    {p}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>

        {/* progress */}
        <div
          className="mt-5 flex items-center gap-3"
          style={{ transform: "translateZ(30px)" }}
        >
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to)"
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>

          <span
            className="text-xs font-medium text-muted-foreground"
            aria-live="polite"
          >
            {done}/{tip.points.length} done
          </span>
        </div>

        {/* actions */}
        <div
          className="mt-6 flex flex-wrap items-center gap-3"
          style={{ transform: "translateZ(50px)" }}
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              href={href(tip)}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to) px-6 py-3 text-sm font-semibold text-(--logo-fg) shadow-lg shadow-brand/30"
            >
              <motion.span
                aria-hidden
                className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/35"
                initial={{ left: "-40%" }}
                animate={{ left: "140%" }}
                transition={{
                  duration: 1.3,
                  repeat: Infinity,
                  repeatDelay: 2.6,
                  ease: "easeInOut",
                }}
              />

              <span className="relative">{tip.cta}</span>
              <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <button
            type="button"
            onClick={onNext}
            className="rounded-full border border-border bg-background/70 px-5 py-3 text-sm font-semibold transition-colors hover:border-brand/50 hover:bg-brand-soft"
          >
            Next tip
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function PlanningTips() {
  const [active, setActive] = useState(0);
  const [ticks, setTicks] = useState<Record<string, boolean[]>>({});

  const tip = TIPS[active];
  const ticked = ticks[tip.id] ?? tip.points.map(() => false);

  const toggle = (i: number) =>
    setTicks((prev) => {
      const cur = prev[tip.id] ?? tip.points.map(() => false);

      return { ...prev, [tip.id]: cur.map((v, idx) => (idx === i ? !v : v)) };
    });

  const progressOf = (t: Tip) =>
    (ticks[t.id] ?? []).filter(Boolean).length / t.points.length;

  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-28">
      <SectionBackdrop flip />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Plan like a pro"
          words={["Wedding Planning"]}
          accent="Tips"
          subtitle="A simple timeline to keep your planning calm, organised and on budget. Tick off each step as you go."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
          {/* tabs */}
          <div
            role="tablist"
            aria-label="Planning tips"
            aria-orientation="vertical"
            className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:gap-3 lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {TIPS.map((t, i) => {
              const Icon = t.icon;
              const on = i === active;
              const p = progressOf(t);
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(i)}
                  className="group relative flex shrink-0 items-center gap-3 rounded-2xl border border-border bg-card/80 p-3 pr-5 text-left outline-none backdrop-blur transition-colors hover:border-brand/40 focus-visible:ring-4 focus-visible:ring-brand/40 lg:p-4"
                >
                  {on && (
                    <motion.span
                      layoutId="tip-active"
                      className="absolute inset-0 rounded-2xl border-2 border-brand bg-brand-soft/60"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 34,
                      }}
                    />
                  )}

                  <span
                    className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-md"
                    style={{
                      background: `linear-gradient(145deg, ${t.from}, ${t.to})`,
                    }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                    {p === 1 && (
                      <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-success text-white ring-2 ring-card">
                        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                      </span>
                    )}
                  </span>

                  <span className="relative min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      0{i + 1} · {t.tag}
                    </span>
                    <span className="block whitespace-nowrap text-sm font-semibold text-foreground lg:whitespace-normal">
                      {t.title}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* detail */}
          <div className="perspective-[1500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tip.id}
                role="tabpanel"
                initial={{ opacity: 0, rotateY: -14, y: 24 }}
                animate={{ opacity: 1, rotateY: 0, y: 0 }}
                exit={{
                  opacity: 0,
                  rotateY: 14,
                  y: -12,
                  transition: { duration: 0.18 },
                }}
                transition={{ type: "spring", stiffness: 140, damping: 18 }}
                style={{ transformPerspective: 1500 }}
              >
                <DetailCard
                  tip={tip}
                  ticked={ticked}
                  onToggle={toggle}
                  onNext={() => setActive((a) => (a + 1) % TIPS.length)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
