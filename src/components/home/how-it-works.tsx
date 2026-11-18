"use client";

/**
 * WedPlan - How WedPlan Works
 * Place at: components/home/how-it-works.tsx   (needs section-kit.tsx)
 *
 * Four steps joined by a connector that draws itself as you scroll (horizontal on desktop,
 * vertical on mobile). Every step card has a small live preview of what the user will see,
 * 3D tilt with layered depth, and a floating step medallion.
 */

import {
  AnimatePresence,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  ListChecks,
  PartyPopper,
  Search,
  Send,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SectionBackdrop, SectionHeading, useTilt } from "./section-kit";

function useCycle(length: number, ms: number) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % length), ms);

    return () => clearInterval(t);
  }, [length, ms]);
  return i;
}

/* mini previews */
function PreviewBrowse() {
  const active = useCycle(3, 1500);

  return (
    <div className="flex flex-wrap gap-1.5">
      {["Photography", "Venues", "Decor"].map((c, i) => (
        <motion.span
          key={c}
          animate={{ scale: active === i ? 1.08 : 1 }}
          className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors duration-300 ${
            active === i
              ? "border-transparent bg-brand text-brand-foreground shadow-md"
              : "border-border bg-background/70 text-muted-foreground"
          }`}
        >
          {c}
        </motion.span>
      ))}
    </div>
  );
}

function PreviewChoose() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-2.5">
      <div className="h-11 w-11 shrink-0 rounded-xl bg-linear-to-br from-(--logo-from) to-(--logo-to)" />

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-2 w-3/4 rounded-full bg-muted" />
        <div className="h-2 w-1/2 rounded-full bg-muted" />
      </div>

      <motion.span
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="rounded-lg bg-brand-soft px-2 py-1 text-[11px] font-bold text-brand"
      >
        ৳ Price
      </motion.span>
    </div>
  );
}

function PreviewRequest() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 rounded-xl border border-border bg-background/70 px-2.5 py-2 text-[11px] font-medium text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 text-brand" /> Pick a date
      </span>

      <span className="relative flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-linear-to-r from-(--logo-from) to-(--logo-to) px-2.5 py-2 text-[11px] font-semibold text-(--logo-fg)">
        <motion.span
          aria-hidden
          className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/35"
          initial={{ left: "-40%" }}
          animate={{ left: "140%" }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.6 }}
        />

        <span className="relative">Send request</span>

        <motion.span
          className="relative"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Send className="h-3.5 w-3.5" />
        </motion.span>
      </span>
    </div>
  );
}

function PreviewConfirm() {
  const i = useCycle(2, 2200);

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-background/70 p-2.5">
      <span className="text-[11px] font-medium text-muted-foreground">
        Booking status
      </span>

      <div className="relative h-7 w-28">
        <AnimatePresence mode="wait">
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className={`absolute inset-0 flex items-center justify-center gap-1 rounded-full text-[11px] font-semibold ${
              i === 0
                ? "bg-gold/25 text-foreground"
                : "bg-success/20 text-success"
            }`}
          >
            {i === 0 ? (
              <Clock className="h-3.5 w-3.5" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {i === 0 ? "Pending" : "Confirmed"}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* steps */
const STEPS: {
  icon: LucideIcon;
  title: string;
  text: string;
  from: string;
  to: string;
  Preview: () => React.ReactElement;
}[] = [
  {
    icon: Search,
    title: "Browse & compare",
    text: "Explore six wedding categories, filter by city and compare prices and vendors.",
    from: "oklch(0.74 0.15 28)",
    to: "oklch(0.52 0.21 10)",
    Preview: PreviewBrowse,
  },
  {
    icon: ListChecks,
    title: "Pick your service",
    text: "Open a service to see full details, photos and information about the vendor.",
    from: "oklch(0.7 0.16 305)",
    to: "oklch(0.46 0.2 285)",
    Preview: PreviewChoose,
  },
  {
    icon: Send,
    title: "Send a booking request",
    text: "Choose your event date and location, add a short note and send it in seconds.",
    from: "oklch(0.84 0.13 80)",
    to: "oklch(0.6 0.17 45)",
    Preview: PreviewRequest,
  },
  {
    icon: PartyPopper,
    title: "Get confirmed & celebrate",
    text: "Track your request from your dashboard and celebrate as soon as it is confirmed.",
    from: "oklch(0.72 0.15 160)",
    to: "oklch(0.5 0.12 180)",
    Preview: PreviewConfirm,
  },
];

function StepCard({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const { ref, reduce, style, glare, handlers } = useTilt(11);
  const Icon = step.icon;
  const Preview = step.Preview;

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 60, rotateX: -28 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 15,
        delay: index * 0.12,
      }}
      style={{ transformOrigin: "50% 100%" }}
      className="grid grid-cols-[auto_1fr] gap-4 lg:block"
    >
      {/* medallion */}
      <div className="relative z-10 lg:mb-6 lg:flex lg:justify-center">
        <motion.div
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{
            duration: 3.6 + index * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <span
            className="grid h-14 w-14 place-items-center rounded-full text-white ring-4 ring-background sm:h-16 sm:w-16"
            style={{
              background: `linear-gradient(145deg, ${step.from}, ${step.to})`,
              boxShadow: `0 14px 30px -8px ${step.to}`,
            }}
          >
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.7} />
          </span>

          <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background ring-2 ring-background">
            {index + 1}
          </span>
        </motion.div>
      </div>

      {/* card */}
      <motion.div
        ref={ref}
        {...handlers}
        whileHover={reduce ? undefined : { y: -6 }}
        style={style}
        className="group relative rounded-3xl border border-border bg-card p-6 shadow-lg transition-shadow duration-500 hover:shadow-2xl hover:shadow-brand/20"
      >
        <motion.div
          aria-hidden
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 mix-blend-soft-light transition-opacity group-hover:opacity-100"
        />

        <h3
          className="font-serif text-xl font-semibold"
          style={{ transform: "translateZ(40px)" }}
        >
          {step.title}
        </h3>

        <p
          className="mt-2 text-sm leading-relaxed text-muted-foreground"
          style={{ transform: "translateZ(24px)" }}
        >
          {step.text}
        </p>

        <div className="mt-5" style={{ transform: "translateZ(55px)" }}>
          <Preview />
        </div>
      </motion.div>
    </motion.li>
  );
}

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 70%", "end 60%"],
  });

  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  const dotLeft = useTransform(
    progress,
    (v) => `${Math.min(Math.max(v, 0), 1) * 100}%`,
  );

  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-28">
      <SectionBackdrop flip />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Simple process"
          words={["How"]}
          accent="WedPlan Works"
          subtitle="From first search to confirmed booking in four easy steps."
        />

        <div ref={sectionRef} className="relative mt-16">
          {/* desktop connector */}
          <div
            aria-hidden
            className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-0.5 rounded-full bg-border lg:block"
          >
            <motion.div
              style={{ scaleX: progress }}
              className="h-full origin-left rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to)"
            />

            <motion.span
              style={{ left: dotLeft }}
              className="absolute -top-1.5 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-(--logo-to) shadow-[0_0_14px_var(--logo-to)]"
            />
          </div>

          {/* mobile connector */}
          <div
            aria-hidden
            className="absolute bottom-8 left-7 top-8 w-0.5 rounded-full bg-border sm:left-8 lg:hidden"
          >
            <motion.div
              style={{ scaleY: progress }}
              className="h-full origin-top rounded-full bg-linear-to-b from-(--logo-from) to-(--logo-to)"
            />
          </div>

          <ol className="grid gap-10 lg:grid-cols-4 lg:gap-6 perspective-[1500px]">
            {STEPS.map((s, i) => (
              <StepCard key={s.title} step={s} index={i} />
            ))}
          </ol>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <motion.div
            className="inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
          >
            <Link
              href="/services"
              className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-semibold shadow-sm transition-colors hover:border-brand/50 hover:bg-brand-soft"
            >
              Start exploring
              <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-brand-foreground transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
