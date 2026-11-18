"use client";

/**
 * WedPlan - global loading UI
 * Place at: app/loading.tsx
 * Next.js shows this automatically while any route segment is loading (inside your layout,
 * so the navbar and footer stay put).
 */

import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";

function MiniRing({
  color,
  rotate,
  x,
}: {
  color: string;
  rotate: number;
  x: number;
}) {
  const slices = 28;
  const radius = 34;
  const tube = 14;
  return (
    <div
      className="absolute inset-0 transform-3d"
      style={{ transform: `translateX(${x}px) rotateY(${rotate}deg)` }}
    >
      <div className="absolute left-1/2 top-1/2 transform-3d">
        {Array.from({ length: slices }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: tube,
              height: tube,
              marginLeft: -tube / 2,
              marginTop: -tube / 2,
              border: `1.5px solid ${color}`,
              boxShadow: `0 0 8px ${color}`,
              transform: `rotateZ(${(360 / slices) * i}deg) translateX(${radius}px) rotateX(90deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  const reduce = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative grid min-h-[70vh] place-items-center overflow-hidden px-4"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-3xl"
      />

      <div className="relative flex flex-col items-center">
        <div className="relative h-36 w-36 perspective-[700px]">
          <motion.div
            className="absolute inset-0 transform-3d"
            animate={
              reduce ? undefined : { rotateY: 360, rotateX: [14, -14, 14] }
            }
            transition={{
              rotateY: { duration: 6, repeat: Infinity, ease: "linear" },
              rotateX: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <MiniRing color="var(--logo-to)" rotate={12} x={-20} />
            <MiniRing color="var(--gold)" rotate={80} x={20} />
          </motion.div>

          <motion.div
            className="absolute left-1/2 top-1/2 -ml-4 -mt-4 text-brand"
            animate={reduce ? undefined : { scale: [1, 1.25, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Heart className="h-8 w-8 fill-current" />
          </motion.div>
        </div>

        <p className="mt-6 font-serif text-xl font-semibold">
          Wed
          <span className="bg-linear-to-r from-(--logo-from) to-(--gold) bg-clip-text text-transparent">
            Plan
          </span>
        </p>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Loading</span>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-brand"
              animate={
                reduce ? undefined : { y: [0, -5, 0], opacity: [0.4, 1, 0.4] }
              }
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>

        <span className="sr-only">Loading, please wait</span>
      </div>
    </div>
  );
}
