"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useId } from "react";

/**
 * WedPlan logo: rose-gold gradient tile with two interlocked wedding rings
 * and a small diamond sparkle above them.
 *
 * Colours come from CSS variables in globals.css, so it adapts to light/dark:
 *   --logo-from / --logo-to / --logo-fg / --logo-accent
 */
export function LogoMark({ size = 38 }: { size?: number }) {
  const id = useId().replace(/:/g, "");

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      whileHover={{ rotate: -6, scale: 1.08 }}
      transition={{ type: "spring", stiffness: 400, damping: 14 }}
      className="drop-shadow-[0_6px_14px_color-mix(in_oklab,var(--logo-from)_45%,transparent)]"
    >
      <defs>
        <linearGradient
          id={`g-${id}`}
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" style={{ stopColor: "var(--logo-from)" }} />
          <stop offset="1" style={{ stopColor: "var(--logo-to)" }} />
        </linearGradient>

        <linearGradient
          id={`s-${id}`}
          x1="0"
          y1="0"
          x2="0"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="white" stopOpacity="0.35" />
          <stop offset="0.55" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Tile + sheen */}
      <rect width="40" height="40" rx="12" fill={`url(#g-${id})`} />
      <rect width="40" height="40" rx="12" fill={`url(#s-${id})`} />

      {/* Left ring */}
      <motion.circle
        cx="15.5"
        cy="24"
        r="7.5"
        strokeWidth="2.8"
        style={{ stroke: "var(--logo-fg)" }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />

      {/* Right ring (interlocked) */}
      <motion.circle
        cx="24.5"
        cy="24"
        r="7.5"
        strokeWidth="2.8"
        style={{ stroke: "var(--logo-accent)" }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
      />

      {/* Diamond sparkle */}
      <motion.path
        d="M20 6.5 L22.2 10 L20 13.5 L17.8 10 Z"
        style={{ fill: "var(--logo-fg)" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.25, 1], opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        // transformOrigin="20px 10px"
      />
    </motion.svg>
  );
}

export function Logo({ showText = true }: { showText?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="WedPlan home"
      className="group flex items-center gap-2.5"
    >
      <LogoMark />

      {showText && (
        <span className="font-serif text-[1.45rem] font-semibold leading-none tracking-tight text-foreground">
          Wed
          <span className="bg-linear-to-r from-(--logo-from) to-(--logo-to) bg-clip-text text-transparent">
            Plan
          </span>
        </span>
      )}
    </Link>
  );
}
