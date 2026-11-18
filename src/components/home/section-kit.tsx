"use client";

/**
 * Shared helpers for the homepage sections.
 * Place at: components/home/section-kit.tsx  (same folder as the section files)
 */

import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionStyle,
} from "framer-motion";
import { Heart, type LucideIcon } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

// 3D tilt (mouse only): rotation, moving glare, parallax offsets
export function useTilt(max = 14, shift = 24) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const gx = useMotionValue(30);
  const gy = useMotionValue(20);

  const rx = useSpring(tx, { stiffness: 170, damping: 17 });
  const ry = useSpring(ty, { stiffness: 170, damping: 17 });
  const sx = useSpring(mx, { stiffness: 120, damping: 18 });
  const sy = useSpring(my, { stiffness: 120, damping: 18 });

  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.4), transparent 55%)`;

  const onPointerMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;

    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    ty.set((px - 0.5) * max);
    tx.set((0.5 - py) * max);
    mx.set((px - 0.5) * shift);
    my.set((py - 0.5) * shift);
    gx.set(px * 100);
    gy.set(py * 100);
  };

  const onPointerLeave = () => {
    tx.set(0);
    ty.set(0);
    mx.set(0);
    my.set(0);
    gx.set(30);
    gy.set(20);
  };

  const style: MotionStyle = {
    rotateX: reduce ? 0 : rx,
    rotateY: reduce ? 0 : ry,
    transformStyle: "preserve-3d",
    transformPerspective: 1100,
  };

  return {
    ref,
    reduce,
    style,
    glare,
    sx,
    sy,
    handlers: { onPointerMove, onPointerLeave },
  };
}

// Count-up number
export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || !ref.current) return;

    const el = ref.current;

    if (reduce) {
      el.textContent = to.toLocaleString() + suffix;
      return;
    }

    const c = animate(0, to, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) =>
        (el.textContent = Math.round(v).toLocaleString() + suffix),
    });

    return () => c.stop();
  }, [inView, to, suffix, reduce]);

  return <span ref={ref}>0{suffix}</span>;
}

// Backdrop
export function SectionBackdrop({ flip = false }: { flip?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <>
      <motion.div
        aria-hidden
        animate={reduce ? undefined : { x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -z-10 h-104 w-104 rounded-full bg-brand/10 blur-3xl ${
          flip ? "-right-32 top-10" : "-left-32 top-10"
        }`}
      />

      <motion.div
        aria-hidden
        animate={reduce ? undefined : { x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -z-10 h-112 w-md rounded-full bg-gold/15 blur-3xl ${
          flip ? "-left-32 bottom-10" : "-right-32 bottom-10"
        }`}
      />

      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60 bg-[radial-gradient(color-mix(in_oklab,var(--foreground)_12%,transparent)_1px,transparent_1px)] bg-size-[30px_30px] mask-[radial-gradient(ellipse_at_50%_20%,black,transparent_70%)]"
      />
    </>
  );
}

// Section heading
export function SectionHeading({
  eyebrow,
  icon: Icon = Heart,
  words,
  accent,
  subtitle,
  align = "center",
  children,
}: {
  eyebrow: string;
  icon?: LucideIcon;
  words: string[];
  accent: string;
  subtitle?: string;
  align?: "center" | "left";
  children?: ReactNode;
}) {
  const center = align === "center";
  return (
    <div
      className={`perspective-[900px] ${center ? "mx-auto max-w-2xl text-center" : "max-w-xl"}`}
    >
      <motion.span
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand shadow-sm backdrop-blur"
      >
        <Icon className="h-3.5 w-3.5" /> {eyebrow}
      </motion.span>

      <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {words.map((word, i) => (
          <motion.span
            key={word + i}
            className="mr-[0.25em] inline-block"
            initial={{ opacity: 0, rotateX: -80, y: 20 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 110,
              damping: 14,
              delay: 0.05 + i * 0.1,
            }}
          >
            {word}
          </motion.span>
        ))}

        <span className="relative inline-block">
          <motion.span
            className="inline-block bg-linear-to-r from-(--logo-from) to-(--logo-to) bg-clip-text italic text-transparent"
            initial={{ opacity: 0, rotateX: -80, y: 20 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 110,
              damping: 14,
              delay: 0.05 + words.length * 0.1,
            }}
          >
            {accent}
          </motion.span>

          <svg
            aria-hidden
            viewBox="0 0 200 14"
            preserveAspectRatio="none"
            className="absolute -bottom-2 left-0 h-3 w-full text-(--logo-to)"
          >
            <motion.path
              d="M2 9 C 35 2, 65 13, 100 7 S 165 2, 198 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 0.9, ease: "easeInOut" }}
            />
          </svg>
        </span>
      </h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-5 text-base text-muted-foreground sm:text-lg"
        >
          {subtitle}
        </motion.p>
      )}
      {children}
    </div>
  );
}
