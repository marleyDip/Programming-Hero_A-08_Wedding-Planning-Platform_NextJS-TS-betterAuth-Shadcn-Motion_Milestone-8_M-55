"use client";

/**
 * WedPlan - global 404 page
 * Place at: app/not-found.tsx
 * Shown for any unknown URL (and when you call notFound() from a route).
 * Big 3D "404" that tilts with the mouse, with two wedding rings drifting apart
 * (a gentle "we lost something" joke), plus quick links back to useful pages.
 */

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowLeft, Home, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function Ring({
  color,
  className,
  delay,
}: {
  color: string;
  className: string;
  delay: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      className={`absolute h-16 w-16 rounded-full border-[6px] sm:h-24 sm:w-24 sm:border-8 ${className}`}
      style={{
        borderColor: color,
        boxShadow: `0 0 28px ${color}, inset 0 0 14px ${color}`,
      }}
      animate={reduce ? undefined : { y: [0, -14, 0], rotate: [0, 12, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

export default function NotFound() {
  const router = useRouter();
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 100, damping: 18 });
  const sy = useSpring(my, { stiffness: 100, damping: 18 });
  const rotateY = useTransform(sx, [-1, 1], [-22, 22]);
  const rotateX = useTransform(sy, [-1, 1], [16, -16]);

  return (
    <main
      onPointerMove={(e) => {
        mx.set((e.clientX / window.innerWidth) * 2 - 1);
        my.set((e.clientY / window.innerHeight) * 2 - 1);
      }}
      className="relative isolate grid min-h-[80vh] place-items-center overflow-hidden px-4 py-20"
    >
      {/* backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 [background:radial-gradient(60%_50%_at_50%_30%,color-mix(in_oklab,var(--brand)_20%,transparent),transparent_70%)]"
      />

      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.06] bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(circle_at_50%_40%,black,transparent_70%)]"
      />

      <div className="flex max-w-2xl flex-col items-center text-center">
        {/* 3D 404 */}
        <div className="relative perspective-[1000px]">
          <Ring
            color="var(--logo-to)"
            className="-left-4 top-2 sm:-left-12"
            delay={0}
          />

          <Ring
            color="var(--gold)"
            className="-right-4 bottom-0 sm:-right-12"
            delay={1.2}
          />

          <motion.h1
            aria-label="404"
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            initial={reduce ? false : { opacity: 0, scale: 0.6, rotateX: -50 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 90, damping: 13 }}
            className="relative flex select-none font-serif text-[7.5rem] font-bold leading-none sm:text-[12rem]"
          >
            {["4", "0", "4"].map((d, i) => (
              <span
                key={i}
                aria-hidden
                className="relative inline-block transform-3d"
              >
                {/* extruded depth layers */}
                {Array.from({ length: 8 }).map((_, k) => (
                  <span
                    key={k}
                    className="absolute inset-0 text-(--logo-to)"
                    style={{
                      transform: `translateZ(${-(k + 1) * 4}px)`,
                      opacity: 0.9 - k * 0.08,
                    }}
                  >
                    {d}
                  </span>
                ))}

                <motion.span
                  className="relative bg-linear-to-br from-(--logo-from) to-(--gold) bg-clip-text text-transparent"
                  animate={reduce ? undefined : { y: [0, -10, 0] }}
                  transition={{
                    duration: 3.5 + i * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }}
                  style={{
                    display: "inline-block",
                    transform: "translateZ(10px)",
                  }}
                >
                  {d}
                </motion.span>
              </span>
            ))}
          </motion.h1>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 font-serif text-2xl font-semibold sm:text-4xl"
        >
          This page missed the wedding
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base"
        >
          The page you are looking for may have moved, been removed, or never
          existed. Let&apos;s get you back to planning.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
            <Link
              href="/"
              className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to) px-6 py-3 text-sm font-semibold text-(--logo-fg) shadow-lg shadow-brand/30"
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

              <Home className="relative h-4 w-4" />
              <span className="relative">Back to home</span>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:border-brand/50 hover:bg-brand-soft"
            >
              <Search className="h-4 w-4" /> Browse services
            </Link>
          </motion.div>

          <motion.button
            type="button"
            onClick={() => router.back()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Go back
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}
