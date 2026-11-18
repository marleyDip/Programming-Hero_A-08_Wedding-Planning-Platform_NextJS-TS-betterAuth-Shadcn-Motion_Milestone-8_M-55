"use client";

/**
 * WedPlan - Popular Wedding Destinations
 * Place at: components/home/destinations.tsx   (needs section-kit.tsx + lib/services-api.ts)
 *
 * Six city cards, each with an illustrated landscape drawn in SVG (no image files needed),
 * parallax layers that react to the mouse, 3D tilt, and a live "N services" count from the API.
 * Each card links to /services?location=<city>.
 *
 * The cards render at once; counts appear when the API answers. If the API is down the cards
 * still work (the count pill just stays hidden).
 */

import { getLocationCounts } from "@/lib/services-api";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { ArrowUpRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionBackdrop, SectionHeading, useTilt } from "./section-kit";

type Kind = "skyline" | "beach" | "hills" | "trees";

interface Destination {
  name: string; // must match the `location` value on services
  tagline: string;
  tags: string[];
  kind: Kind;
  from: string;
  to: string;
}

const DESTINATIONS: Destination[] = [
  {
    name: "Dhaka",
    tagline: "The vibrant capital",
    tags: ["Banquet halls", "Convention centres", "Rooftops"],
    kind: "skyline",
    from: "oklch(0.74 0.15 40)",
    to: "oklch(0.46 0.2 20)",
  },
  {
    name: "Chattogram",
    tagline: "Hills, harbour & sea breeze",
    tags: ["Hilltop venues", "Seaside halls", "Resorts"],
    kind: "hills",
    from: "oklch(0.72 0.13 220)",
    to: "oklch(0.42 0.16 250)",
  },
  {
    name: "Sylhet",
    tagline: "Tea gardens & misty hills",
    tags: ["Tea-garden resorts", "Hillside lawns", "Boutique stays"],
    kind: "hills",
    from: "oklch(0.78 0.14 155)",
    to: "oklch(0.42 0.12 175)",
  },
  {
    name: "Rajshahi",
    tagline: "Heritage & mango orchards",
    tags: ["Garden lawns", "Heritage venues", "Community halls"],
    kind: "trees",
    from: "oklch(0.84 0.13 80)",
    to: "oklch(0.55 0.16 50)",
  },
  {
    name: "Khulna",
    tagline: "Gateway to the Sundarbans",
    tags: ["Riverside venues", "Garden halls", "Resorts"],
    kind: "trees",
    from: "oklch(0.72 0.12 175)",
    to: "oklch(0.4 0.1 200)",
  },
  {
    name: "Cox's Bazar",
    tagline: "Say “I do” by the sea",
    tags: ["Beachfront", "Sunset ceremonies", "Resorts"],
    kind: "beach",
    from: "oklch(0.8 0.14 60)",
    to: "oklch(0.55 0.2 15)",
  },
];

// Illustrated landscape
function Scene({
  kind,
  sx,
  sy,
}: {
  kind: Kind;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
}) {
  const backX = useTransform(sx, [-24, 24], [10, -10]);
  const frontX = useTransform(sx, [-24, 24], [-18, 18]);
  const backY = useTransform(sy, [-24, 24], [4, -4]);
  const frontY = useTransform(sy, [-24, 24], [-8, 8]);

  const wave = (y: number) =>
    `M-100 ${y} Q-50 ${y - 18} 0 ${y} T100 ${y} T200 ${y} T300 ${y} T400 ${y} T500 ${y} V240 H-100z`;

  return (
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-x-0 bottom-0 h-[78%] w-full overflow-hidden"
      aria-hidden
    >
      {kind === "beach" && (
        <circle cx="292" cy="78" r="36" fill="white" opacity="0.85" />
      )}

      <motion.g style={{ x: backX, y: backY }} fill="white">
        {kind === "skyline" && (
          <path
            opacity="0.25"
            d="M-20 240V150h50V120h28v50h24V100h30v70h26V130h34v40h22V90h32v80h28V140h30v100z"
          />
        )}

        {kind === "hills" && (
          <path
            opacity="0.28"
            d="M-20 240V150Q80 80 170 140T340 115T430 150V240z"
          />
        )}

        {kind === "trees" &&
          [30, 120, 210, 300, 380].map((x, i) => (
            <g key={x} opacity="0.3">
              <rect x={x - 3} y={150 + (i % 2) * 8} width="6" height="40" />
              <circle cx={x} cy={140 + (i % 2) * 8} r="26" />
            </g>
          ))}

        {kind === "beach" && <path opacity="0.3" d={wave(165)} />}
      </motion.g>

      <motion.g style={{ x: frontX, y: frontY }} fill="white">
        {kind === "skyline" && (
          <>
            <path
              opacity="0.45"
              d="M-20 240V190h60V160h26v30h30V145h34v45h28V170h40v20h30V150h30v40h38V175h38v65z"
            />
            <circle cx="150" cy="140" r="14" opacity="0.45" />
          </>
        )}

        {kind === "hills" && (
          <>
            <path opacity="0.5" d="M-20 240V185Q100 130 205 178T430 160V240z" />
            <path
              opacity="0.78"
              d="M-20 240V208Q120 172 225 203T430 192V240z"
            />
          </>
        )}

        {kind === "trees" && (
          <>
            <path opacity="0.55" d="M-20 240V205H430V240z" />
            {[60, 160, 250, 335].map((x, i) => (
              <g key={x} opacity="0.6">
                <rect x={x - 4} y={160 + (i % 2) * 6} width="8" height="46" />
                <circle cx={x} cy={150 + (i % 2) * 6} r="32" />
              </g>
            ))}
          </>
        )}

        {kind === "beach" && (
          <>
            <motion.path
              opacity="0.5"
              d={wave(195)}
              animate={{ x: [0, 100] }}
              transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            />

            <motion.path
              opacity="0.75"
              d={wave(218)}
              animate={{ x: [0, -100] }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
            />
          </>
        )}
      </motion.g>
    </svg>
  );
}

// Card
function DestinationCard({
  d,
  index,
  count,
}: {
  d: Destination;
  index: number;
  count: number | undefined;
}) {
  const { ref, reduce, style, glare, sx, sy, handlers } = useTilt(12, 24);

  const label =
    count !== undefined
      ? `${d.name}, ${count} ${count === 1 ? "service" : "services"}`
      : d.name;

  return (
    <motion.li
      initial={
        reduce ? false : { opacity: 0, y: 70, rotateX: -32, scale: 0.94 }
      }
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 15,
        delay: (index % 3) * 0.1,
      }}
      style={{ transformOrigin: "50% 100%" }}
      className="lg:nth-[3n+2]:mt-10"
    >
      <Link
        href={`/services?location=${encodeURIComponent(d.name)}`}
        aria-label={label}
        className="group block rounded-[1.75rem] outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
      >
        <motion.div
          ref={ref}
          {...handlers}
          whileHover={reduce ? undefined : { y: -8 }}
          style={style}
          className="relative aspect-[4/4.7] rounded-[1.75rem] shadow-lg transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-black/30"
        >
          {/* plate */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[1.75rem] border border-white/20"
            style={{
              background: `linear-gradient(175deg, ${d.from}, ${d.to})`,
            }}
          >
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(rgba(255,255,255,0.45)_1px,transparent_1px)] bg-size-[18px_18px]" />

            <Scene kind={d.kind} sx={sx} sy={sy} />

            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/5 to-white/10" />

            <motion.div
              aria-hidden
              style={{ background: glare }}
              className="absolute inset-0 mix-blend-soft-light"
            />
          </div>

          {/* index */}
          <span
            aria-hidden
            className="absolute left-6 top-5 font-serif text-4xl font-bold text-white/30"
            style={{ transform: "translateZ(20px)" }}
          >
            0{index + 1}
          </span>

          {/* count */}
          {count !== undefined && (
            <div
              className="absolute right-5 top-5"
              style={{ transform: "translateZ(55px)" }}
            >
              <span className="inline-flex items-center rounded-full border border-white/30 bg-neutral-950/45 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
                {count} {count === 1 ? "service" : "services"}
              </span>
            </div>
          )}

          {/* text */}
          <div
            className="absolute inset-x-6 bottom-6 pr-14"
            style={{ transform: "translateZ(50px)" }}
          >
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
              <MapPin className="h-3.5 w-3.5" /> {d.tagline}
            </p>

            <h3 className="mt-1.5 font-serif text-3xl font-semibold leading-tight text-white drop-shadow">
              {d.name}
            </h3>

            <ul className="mt-3 flex translate-y-2 flex-wrap gap-1.5 opacity-100 transition-all duration-500 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100">
              {d.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* arrow */}
          <div
            className="absolute bottom-6 right-5"
            style={{ transform: "translateZ(75px)" }}
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-neutral-900 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-neutral-950 group-hover:text-white">
              <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
            </span>
          </div>
        </motion.div>
      </Link>
    </motion.li>
  );
}

export default function Destinations() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();

    getLocationCounts(ctrl.signal)
      .then(setCounts)
      .catch(() => undefined);
    return () => ctrl.abort();
  }, []);

  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-28">
      <SectionBackdrop flip />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Where dreams come true"
          words={["Popular Wedding"]}
          accent="Destinations"
          subtitle="From the capital's grand halls to beachside sunsets, explore services in the cities couples love most."
        />

        <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7 perspective-[1500px]">
          {DESTINATIONS.map((d, i) => (
            <DestinationCard
              key={d.name}
              d={d}
              index={i}
              count={counts ? (counts[d.name] ?? 0) : undefined}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
