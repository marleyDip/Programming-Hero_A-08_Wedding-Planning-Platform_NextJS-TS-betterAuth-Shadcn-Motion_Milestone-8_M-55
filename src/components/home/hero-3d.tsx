"use client";

/**
 * WedPlan - 3D Hero Slider
 * Place at: components/home/hero-3d.tsx   ->   <Hero3D /> at the top of app/page.tsx
 *
 * Pure CSS-3D + Framer Motion (no three.js / extra packages).
 *
 * What's 3D here
 *  - Coverflow slider: cards sit on a real depth axis (translateZ + rotateY), the centre card
 *    comes forward, neighbours recede
 *  - Whole scene tilts with the mouse (perspective parallax); sparkles, rings and cards at
 *    different depths shift against each other automatically
 *  - Each card is a layered object: icon, title and info chips float at different translateZ,
 *    so tilting the card shows real depth, plus a moving glare
 *  - Gyroscope of gold wedding rings rotating on 3 axes behind the slider
 *  - Perspective grid floor that scrolls toward you, 3D flip headline
 *
 * Interactions: drag / swipe, click a side card, arrows, dots with progress, keyboard ← →,
 * autoplay (pauses on hover/focus/drag). Fully responsive (card sizes + depth adapt to width).
 * Respects prefers-reduced-motion.
 *
 * Numbers (vendor counts, "from" prices, ratings) are PLACEHOLDERS in SLIDES; replace with real data.
 */

import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Flower2,
  Heart,
  Shirt,
  Sparkles,
  Star,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// Slides
const DURATION = 6.5;

interface Slide {
  id: string;
  category: string; // must match your category names
  label: string;
  eyebrow: string;
  title: [string, string];
  description: string;
  tags: string[];
  icon: LucideIcon;
  vendors: string;
  from: string;
  rating: string;
  c1: string;
  c2: string;
  glow: string;
}

const SLIDES: Slide[] = [
  {
    id: "venues",
    category: "Wedding Venues",
    label: "Venues",
    eyebrow: "Halls, gardens & resorts",
    title: ["Say “I Do” in a", "Place Made for Two"],
    description:
      "From grand banquet halls to quiet garden settings and beachside resorts, find the venue that fits your style and guest list.",
    tags: ["Banquet halls", "Garden venues", "Resorts"],
    icon: Building2,
    vendors: "320+",
    from: "৳25,000",
    rating: "4.9",
    c1: "oklch(0.74 0.15 28)",
    c2: "oklch(0.5 0.21 10)",
    glow: "oklch(0.65 0.22 15 / 55%)",
  },
  {
    id: "photo",
    category: "Photography & Videography",
    label: "Photography",
    eyebrow: "Photos & cinematic films",
    title: ["Frame Every", "Forever Moment"],
    description:
      "Book photographers and filmmakers who turn your wedding day into a story worth reliving, from pre-wedding shoots to drone coverage.",
    tags: ["Pre-wedding shoot", "Cinematic film", "Drone"],
    icon: Camera,
    vendors: "480+",
    from: "৳15,000",
    rating: "4.8",
    c1: "oklch(0.7 0.16 305)",
    c2: "oklch(0.45 0.2 285)",
    glow: "oklch(0.6 0.22 300 / 55%)",
  },
  {
    id: "decor",
    category: "Decoration & Florist",
    label: "Decor",
    eyebrow: "Stages, flowers & lighting",
    title: ["Bloom Into", "Pure Magic"],
    description:
      "Dreamy stages, floral arches and glowing ambience, designed by decorators who bring your vision to life.",
    tags: ["Stage design", "Floral arches", "Mood lighting"],
    icon: Flower2,
    vendors: "260+",
    from: "৳20,000",
    rating: "4.9",
    c1: "oklch(0.84 0.13 80)",
    c2: "oklch(0.6 0.17 40)",
    glow: "oklch(0.78 0.16 70 / 55%)",
  },
  {
    id: "catering",
    category: "Catering Services",
    label: "Catering",
    eyebrow: "Menus for every table",
    title: ["A Feast Your Guests", "Will Remember"],
    description:
      "Traditional menus, live counters and sweet endings, crafted by caterers who treat every guest like family.",
    tags: ["Traditional menus", "Live counters", "Desserts"],
    icon: UtensilsCrossed,
    vendors: "210+",
    from: "৳450 / guest",
    rating: "4.7",
    c1: "oklch(0.76 0.14 155)",
    c2: "oklch(0.48 0.12 180)",
    glow: "oklch(0.68 0.16 165 / 50%)",
  },
  {
    id: "makeup",
    category: "Makeup & Styling",
    label: "Makeup",
    eyebrow: "Bridal & groom looks",
    title: ["Glow on the", "Biggest Day"],
    description:
      "Radiant bridal makeup, hair styling and polished grooming from artists who make you feel unmistakably you.",
    tags: ["Bridal makeup", "Hair styling", "Groom grooming"],
    icon: Sparkles,
    vendors: "350+",
    from: "৳8,000",
    rating: "4.9",
    c1: "oklch(0.78 0.16 350)",
    c2: "oklch(0.5 0.22 335)",
    glow: "oklch(0.7 0.22 345 / 55%)",
  },
  {
    id: "fashion",
    category: "Wedding Fashion",
    label: "Fashion",
    eyebrow: "Outfits & accessories",
    title: ["Dressed for", "Your Fairytale"],
    description:
      "Sarees, lehengas, sherwanis and finishing touches. Find designers and boutiques for every wedding moment.",
    tags: ["Bridal wear", "Sherwani", "Jewellery"],
    icon: Shirt,
    vendors: "190+",
    from: "৳12,000",
    rating: "4.8",
    c1: "oklch(0.72 0.19 20)",
    c2: "oklch(0.46 0.2 0)",
    glow: "oklch(0.64 0.23 10 / 55%)",
  },
];

const N = SLIDES.length;

/* Deterministic sparkles (no Math.random -> no hydration mismatch) */
const SPARKS = Array.from({ length: 20 }, (_, i) => ({
  left: (i * 41 + 7) % 100,
  top: (i * 29 + 13) % 100,
  size: 3 + ((i * 5) % 7),
  z: -260 + ((i * 53) % 560),
  dur: 4 + ((i * 3) % 6),
  delay: (i * 0.45) % 4,
}));

// 3D card
function Card3D({
  slide,
  index,
  d,
  w,
  h,
  spacing,
  maxVisible,
  onSelect,
}: {
  slide: Slide;
  index: number;
  d: number;
  w: number;
  h: number;
  spacing: number;
  maxVisible: number;
  onSelect: () => void;
}) {
  const Icon = slide.icon;
  const active = d === 0;
  const abs = Math.abs(d);
  const visible = abs <= maxVisible;
  const ref = useRef<HTMLDivElement>(null);

  /* per-card tilt + glare (active card only) */
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const rx = useSpring(tx, { stiffness: 160, damping: 16 });
  const ry = useSpring(ty, { stiffness: 160, damping: 16 });
  const gx = useMotionValue(30);
  const gy = useMotionValue(15);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.45), transparent 52%)`;

  const onMove = (e: React.PointerEvent) => {
    if (!active || !ref.current) return;

    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    ty.set((px - 0.5) * 22);
    tx.set((0.5 - py) * 22);
    gx.set(px * 100);
    gy.set(py * 100);
  };

  const onLeave = () => {
    tx.set(0);
    ty.set(0);
    gx.set(30);
    gy.set(15);
  };

  return (
    <motion.div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${N}: ${slide.label}`}
      aria-hidden={!active}
      onClick={() => !active && onSelect()}
      initial={false}
      animate={{
        x: d * spacing,
        z: active ? 70 : -Math.abs(d) * 150,
        rotateY: -d * 34,
        scale: active ? 1 : 1 - abs * 0.06,
        opacity: visible ? 1 : 0,
      }}
      transition={{ type: "spring", stiffness: 95, damping: 18, mass: 0.9 }}
      style={{
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        transformStyle: "preserve-3d",
        pointerEvents: visible ? "auto" : "none",
        cursor: active ? "default" : "pointer",
      }}
      className="absolute left-1/2 top-1/2"
    >
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="relative h-full w-full"
      >
        {/* back plate (flat, clipped) */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/25 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.65)]"
          style={{
            background: `linear-gradient(160deg, ${slide.c1}, ${slide.c2})`,
          }}
        >
          {/* arch outlines */}
          {[0.86, 0.64, 0.42].map((s) => (
            <span
              key={s}
              aria-hidden
              className="absolute left-1/2 top-[6%] aspect-1/1.5 -translate-x-1/2 rounded-t-[999px] border border-white/25"
              style={{ width: `${s * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-white/15" />

          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] bg-size-[18px_18px]" />

          {/* glare */}
          {active && (
            <motion.div
              aria-hidden
              style={{ background: glare }}
              className="absolute inset-0 mix-blend-soft-light"
            />
          )}

          {/* depth dim */}
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-black"
            animate={{ opacity: active ? 0 : Math.min(0.2 + abs * 0.18, 0.6) }}
          />
        </div>

        {/* big index (depth 20) */}
        <span
          aria-hidden
          className="absolute left-5 top-4 font-serif text-5xl font-bold text-white/25"
          style={{ transform: "translateZ(20px)" }}
        >
          0{index + 1}
        </span>

        {/* icon medallion (depth 80) */}
        <div
          className="absolute left-1/2 top-[17%] -translate-x-1/2"
          style={{
            transform: "translateZ(80px)",
            transformStyle: "preserve-3d",
          }}
        >
          <motion.div
            animate={active ? { y: [0, -8, 0], rotateY: [0, 12, 0] } : { y: 0 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="grid place-items-center rounded-full border border-white/40 bg-white/20 text-white shadow-2xl backdrop-blur-md"
            style={{ width: w * 0.32, height: w * 0.32 }}
          >
            <Icon
              style={{ width: w * 0.15, height: w * 0.15 }}
              strokeWidth={1.5}
            />
          </motion.div>
        </div>

        {/* title block (depth 50) */}
        <div
          className="absolute inset-x-5 bottom-5"
          style={{ transform: "translateZ(50px)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
            {slide.eyebrow}
          </p>

          <h3 className="mt-1 font-serif text-2xl font-semibold leading-tight text-white drop-shadow sm:text-[1.7rem]">
            {slide.label}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-xs text-white/80">
            <Star className="h-3.5 w-3.5 fill-current text-yellow-200" />
            {slide.rating}
            <span className="h-1 w-1 rounded-full bg-white/50" />
            {slide.vendors} vendors
          </div>
        </div>

        {/* chips popping out (depth 120), active only */}
        <AnimatePresence>
          {active && (
            <>
              <motion.div
                key="chip-a"
                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  delay: 0.35,
                  type: "spring",
                  stiffness: 160,
                  damping: 14,
                }}
                className="absolute -left-5 top-[38%] hidden sm:block"
                style={{ z: 120 }}
              >
                <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-neutral-950/55 px-3 py-2 text-white shadow-2xl backdrop-blur-xl">
                  <Wallet className="h-4 w-4 text-yellow-200" />

                  <div className="text-[11px] leading-tight">
                    <p className="text-white/60">From</p>
                    <p className="text-sm font-semibold">{slide.from}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                key="chip-b"
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  delay: 0.5,
                  type: "spring",
                  stiffness: 160,
                  damping: 14,
                }}
                className="absolute -right-5 top-[12%] hidden sm:block"
                style={{ z: 110 }}
              >
                <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-neutral-950/55 px-3 py-2 text-white shadow-2xl backdrop-blur-xl">
                  <Users className="h-4 w-4 text-pink-200" />

                  <p className="text-sm font-semibold">{slide.vendors}</p>

                  <p className="text-[11px] text-white/60">verified</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// Gyroscope of rings
function Gyroscope({ reduce }: { reduce: boolean | null }) {
  const rings = [
    {
      anim: {
        rotateY: 360,
      },
      dur: 22,
      inset: "0%",
      style: {},
    },

    {
      anim: {
        rotateX: 360,
      },
      dur: 30,
      inset: "9%",
      style: {},
    },

    {
      anim: {
        rotateZ: -360,
      },
      dur: 40,
      inset: "18%",
      style: { rotateX: 68 },
    },
  ];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(120%,640px)] -translate-x-1/2 -translate-y-1/2"
      style={{
        transform: "translate(-50%,-50%) translateZ(-260px)",
        transformStyle: "preserve-3d",
      }}
    >
      {rings.map((r, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 border-[color-mix(in_oklab,var(--gold)_55%,transparent)] shadow-[0_0_40px_color-mix(in_oklab,var(--gold)_35%,transparent),inset_0_0_30px_color-mix(in_oklab,var(--gold)_20%,transparent)]"
          style={{ inset: r.inset, ...r.style, transformStyle: "preserve-3d" }}
          animate={reduce ? undefined : r.anim}
          transition={{ duration: r.dur, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}

// Flip headline
function FlipHeadline({ slide }: { slide: Slide }) {
  return (
    <h1 className="font-serif text-[2.5rem] font-semibold leading-[1.06] tracking-tight text-white sm:text-6xl xl:text-7xl perspective-[900px]">
      {slide.title.map((line, li) => (
        <span key={li} className="block pb-[0.1em]">
          {line.split(" ").map((word, wi) => (
            <motion.span
              key={wi}
              className={`mr-[0.24em] inline-block origin-[50%_100%] ${
                li === 1
                  ? "bg-linear-to-r from-white via-(--gold) to-pink-200 bg-clip-text text-transparent"
                  : ""
              }`}
              initial={{ rotateX: -95, y: 28, opacity: 0 }}
              animate={{ rotateX: 0, y: 0, opacity: 1 }}
              exit={{
                rotateX: 95,
                y: -20,
                opacity: 0,
                transition: { duration: 0.22 },
              }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 15,
                delay: 0.12 + li * 0.14 + wi * 0.06,
              }}
            >
              {word}
            </motion.span>
          ))}
        </span>
      ))}
    </h1>
  );
}

// Hero
export default function Hero3D() {
  const reduce = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [stageW, setStageW] = useState(560);
  const stageRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const slide = SLIDES[index];

  /* responsive sizing */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([e]) => setStageW(e.contentRect.width));

    ro.observe(el);
    setStageW(el.clientWidth);

    return () => ro.disconnect();
  }, []);

  const cardW =
    stageW < 420 ? 190 : stageW < 640 ? 230 : stageW < 900 ? 260 : 290;
  const cardH = Math.round(cardW * 1.5);
  const spacing = cardW * (stageW < 520 ? 0.62 : 0.66);
  const maxVisible = stageW < 520 ? 1 : 2;

  /* pointer -> scene tilt */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 55, damping: 16 });
  const smy = useSpring(my, { stiffness: 55, damping: 16 });
  const sceneRY = useTransform(smx, [-0.5, 0.5], [-13, 13]);
  const sceneRX = useTransform(smy, [-0.5, 0.5], [9, -9]);
  const textRY = useTransform(smx, [-0.5, 0.5], [-3, 3]);
  const textRX = useTransform(smy, [-0.5, 0.5], [2, -2]);

  const goTo = useCallback(
    (to: number) => {
      progress.set(0);
      setIndex(((to % N) + N) % N);
    },
    [progress],
  );

  /* autoplay driven by the progress value (pause keeps position) */
  useEffect(() => {
    if (paused || dragging || reduce) return;

    const controls = animate(progress, 1, {
      duration: Math.max(DURATION * (1 - progress.get()), 0.01),
      ease: "linear",
      onComplete: () => goTo(index + 1),
    });

    return () => controls.stop();
  }, [paused, dragging, reduce, index, goTo, progress]);

  const rel = (i: number) => {
    let diff = i - index;
    if (diff > N / 2) diff -= N;
    if (diff < -N / 2) diff += N;
    return diff;
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Wedding services"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(index + 1);
        if (e.key === "ArrowLeft") goTo(index - 1);
      }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        mx.set(0);
        my.set(0);
      }}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative isolate min-h-svh overflow-hidden bg-[#0d0710] text-white outline-none"
    >
      {/* backgrounds */}
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.id}
          aria-hidden
          className="absolute inset-0 -z-30"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 72% 45%, ${slide.glow}, transparent 70%), radial-gradient(ellipse 50% 50% at 10% 90%, color-mix(in oklab, ${slide.c2} 45%, transparent), transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1 }}
        />
      </AnimatePresence>

      {/* grid floor */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-20 h-[48%] overflow-hidden perspective-[420px]"
      >
        <motion.div
          className="absolute inset-x-[-30%] bottom-0 h-[160%] origin-bottom bg-[linear-gradient(rgba(255,255,255,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.13)_1px,transparent_1px)] bg-size-[56px_56px] mask-[linear-gradient(to_top,black,transparent_78%)]"
          style={{ transform: "rotateX(68deg)" }}
          animate={
            reduce ? undefined : { backgroundPositionY: ["0px", "56px"] }
          }
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-20 h-40 bg-linear-to-b from-black/50 to-transparent"
      />

      {/* layout */}
      <div className="mx-auto grid min-h-svh max-w-7xl items-center gap-6 px-4 pb-24 pt-28 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-4 lg:px-8 lg:pb-16 lg:pt-24">
        {/* text */}
        <motion.div
          style={{
            rotateX: textRX,
            rotateY: textRY,
            transformPerspective: 1200,
          }}
          className="relative z-10"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
            >
              <motion.span
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.05 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] backdrop-blur-md"
              >
                <Heart className="h-3.5 w-3.5 fill-current text-pink-300" />
                {slide.eyebrow}
              </motion.span>

              <div className="mt-6">
                <FlipHeadline slide={slide} />
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg"
              >
                {slide.description}
              </motion.p>

              {/* tags */}
              <motion.ul
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: { staggerChildren: 0.07, delayChildren: 0.75 },
                  },
                }}
                className="mt-5 flex flex-wrap gap-2"
              >
                {slide.tags.map((t) => (
                  <motion.li
                    key={t}
                    variants={{
                      hidden: { opacity: 0, y: 10, scale: 0.9 },
                      show: { opacity: 1, y: 0, scale: 1 },
                    }}
                    className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs backdrop-blur"
                  >
                    {t}
                  </motion.li>
                ))}
              </motion.ul>

              {/* stats */}
              <motion.dl
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="mt-7 grid max-w-md grid-cols-3 gap-3"
              >
                {[
                  { icon: Users, k: "Vendors", v: slide.vendors },
                  { icon: Wallet, k: "Starting", v: slide.from },
                  { icon: Star, k: "Rating", v: slide.rating },
                ].map(({ icon: I, k, v }) => (
                  <div
                    key={k}
                    className="rounded-2xl border border-white/15 bg-white/[0.07] p-3 backdrop-blur-md"
                  >
                    <I className="h-4 w-4 text-(--gold)" />

                    <dd className="mt-1.5 text-base font-semibold leading-tight sm:text-lg">
                      {v}
                    </dd>

                    <dt className="text-[11px] uppercase tracking-wider text-white/55">
                      {k}
                    </dt>
                  </div>
                ))}
              </motion.dl>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Link
                    href="/services"
                    className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-neutral-900 shadow-2xl shadow-black/40"
                  >
                    <motion.span
                      aria-hidden
                      className="absolute inset-y-0 w-1/3 -skew-x-12 bg-neutral-900/10"
                      initial={{ left: "-40%" }}
                      animate={{ left: "140%" }}
                      transition={{
                        duration: 1.3,
                        repeat: Infinity,
                        repeatDelay: 2.2,
                        ease: "easeInOut",
                      }}
                    />
                    <span className="relative">Explore Wedding Services</span>
                    <span className="relative grid h-6 w-6 place-items-center rounded-full bg-neutral-900 text-white transition-transform duration-300 group-hover:translate-x-1">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Link
                    href={`/services?category=${encodeURIComponent(slide.category)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold backdrop-blur-md transition-colors hover:bg-white/20"
                  >
                    Browse {slide.label}
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* 3D stage */}
        <div className="relative z-10 perspective-[1700px]">
          <motion.div
            ref={stageRef}
            onPanStart={() => setDragging(true)}
            onPanEnd={(_, info) => {
              setDragging(false);
              if (info.offset.x < -60) goTo(index + 1);
              else if (info.offset.x > 60) goTo(index - 1);
            }}
            style={{
              rotateX: reduce ? 0 : sceneRX,
              rotateY: reduce ? 0 : sceneRY,
              transformStyle: "preserve-3d",
              height: cardH + 90,
            }}
            className="relative w-full touch-pan-y select-none"
          >
            <Gyroscope reduce={reduce} />

            {/* sparkles at different depths */}
            {!reduce &&
              SPARKS.map((s, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="absolute rounded-full bg-white"
                  style={{
                    left: `${s.left}%`,
                    top: `${s.top}%`,
                    width: s.size,
                    height: s.size,
                    z: s.z,
                    boxShadow: "0 0 12px 2px rgba(255,255,255,0.7)",
                  }}
                  animate={{ y: [0, -16, 0], opacity: [0.25, 0.95, 0.25] }}
                  transition={{
                    duration: s.dur,
                    delay: s.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              ))}

            {/* floor glow */}
            <motion.div
              aria-hidden
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-1 left-1/2 h-12 w-[70%] rounded-[50%] blur-2xl"
              style={{ background: slide.glow, x: "-50%", z: -40 }}
            />

            {/* cards */}
            {SLIDES.map((s, i) => (
              <Card3D
                key={s.id}
                slide={s}
                index={i}
                d={rel(i)}
                w={cardW}
                h={cardH}
                spacing={spacing}
                maxVisible={maxVisible}
                onSelect={() => goTo(i)}
              />
            ))}
          </motion.div>

          {/* dock */}
          <div className="mx-auto mt-6 flex w-fit max-w-full items-center gap-4 rounded-full border border-white/15 bg-white/10 px-3 py-2 shadow-2xl backdrop-blur-xl">
            <motion.button
              type="button"
              aria-label="Previous slide"
              onClick={() => goTo(index - 1)}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 transition-colors hover:bg-white hover:text-neutral-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.button>

            <ol
              className="flex items-center gap-1.5 sm:gap-2"
              aria-label="Slides"
            >
              {SLIDES.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to ${s.label}`}
                    aria-current={i === index}
                    className="group flex h-8 items-center"
                  >
                    <motion.span
                      layout
                      className="relative block h-1.5 overflow-hidden rounded-full bg-white/30"
                      animate={{ width: i === index ? 44 : 10 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 24,
                      }}
                    >
                      <motion.span
                        className="absolute inset-0 origin-left rounded-full bg-white"
                        style={{ scaleX: i === index ? progress : 0 }}
                      />
                    </motion.span>
                  </button>
                </li>
              ))}
            </ol>

            <span
              className="hidden min-w-[3.2rem] text-center font-mono text-xs text-white/70 sm:block"
              aria-live="polite"
            >
              0{index + 1} / 0{N}
            </span>

            <motion.button
              type="button"
              aria-label="Next slide"
              onClick={() => goTo(index + 1)}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/10 transition-colors hover:bg-white hover:text-neutral-900"
            >
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
