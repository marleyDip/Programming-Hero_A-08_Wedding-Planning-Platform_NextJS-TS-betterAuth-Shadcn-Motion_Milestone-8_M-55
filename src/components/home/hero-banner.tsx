"use client";

/**
 * WedPlan - 4-slide animated hero banner
 * Place at: components/home/hero-banner.tsx   ->   <HeroBanner /> at the top of app/page.tsx
 *
 * Assignment banner spec: clear headline, short description, CTA "Explore Wedding Services",
 * wedding-themed background. Each slide ships with an illustrated (no image files needed)
 * background; add a real photo per slide with the optional `image` field in SLIDES.
 *
 * Interactions & motion
 *  - Autoplay (6.5s) with per-slide progress bars; pauses on hover / focus; resumes where it stopped
 *  - Next / prev buttons, clickable slide tabs, keyboard arrows, swipe on touch
 *  - Circular clip-path reveal between slide backgrounds
 *  - Word-by-word headline reveal, direction-aware
 *  - Mouse parallax (multi-depth layers) + cursor spotlight
 *  - Orbiting icon scene that changes per slide, floating glass info card
 *  - Falling petals, rotating rings, shimmering CTA
 *  - Respects prefers-reduced-motion (no autoplay, no petals)
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
  type MotionValue,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Cake,
  Camera,
  Church,
  Crown,
  Flower2,
  Gem,
  Heart,
  Palette,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  UtensilsCrossed,
  Video,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

// Slides config
const DURATION = 6.5; // seconds per slide

interface Slide {
  id: string;
  label: string;
  eyebrow: string;
  title: [string, string, string];
  highlight: 0 | 1 | 2; // which headline line gets the gradient
  description: string;
  category?: { name: string; label: string };
  centerIcon: LucideIcon;
  orbitA: LucideIcon[];
  orbitB: LucideIcon[];
  card: { icon: LucideIcon; title: string; text: string };
  /* colours */
  from: string;
  via: string;
  to: string;
  glow: string;
  a1: string;
  a2: string;
  /** Optional photo (e.g. "/banner-1.jpg"). Leave empty to use the illustrated background. */
  image?: string;
}

const SLIDES: Slide[] = [
  {
    id: "plan",
    label: "Plan",
    eyebrow: "Wedding planning, simplified",
    title: ["Plan Your", "Dream Wedding", "Effortlessly"],
    highlight: 1,
    description:
      "Discover trusted vendors, compare services and send booking requests, all from one beautiful platform.",
    centerIcon: Heart,
    orbitA: [Camera, Building2, Flower2],
    orbitB: [UtensilsCrossed, Sparkles, Shirt, Gem],
    card: {
      icon: ShieldCheck,
      title: "Verified vendors",
      text: "Reviewed by our team",
    },
    from: "oklch(0.5 0.2 8)",
    via: "oklch(0.33 0.14 350)",
    to: "oklch(0.18 0.06 330)",
    glow: "oklch(0.7 0.2 15 / 55%)",
    a1: "oklch(0.92 0.09 15)",
    a2: "oklch(0.9 0.12 85)",
  },
  {
    id: "venue",
    label: "Venues",
    eyebrow: "Halls, gardens & resorts",
    title: ["Find the Perfect", "Wedding Venue", "for Your Day"],
    highlight: 1,
    description:
      "From grand banquet halls to intimate garden settings, explore venues that match your style and guest list.",
    category: { name: "Wedding Venues", label: "Browse Venues" },
    centerIcon: Building2,
    orbitA: [Church, Star, Crown],
    orbitB: [Flower2, Gem, Heart, Sparkles],
    card: {
      icon: Building2,
      title: "Venues for every budget",
      text: "Filter by city & price",
    },
    from: "oklch(0.55 0.13 65)",
    via: "oklch(0.33 0.09 45)",
    to: "oklch(0.18 0.04 30)",
    glow: "oklch(0.78 0.15 80 / 50%)",
    a1: "oklch(0.95 0.08 90)",
    a2: "oklch(0.88 0.12 50)",
  },
  {
    id: "photo",
    label: "Memories",
    eyebrow: "Photography & videography",
    title: ["Capture Every", "Beautiful Moment", "Forever"],
    highlight: 1,
    description:
      "Book talented photographers and filmmakers who turn your wedding day into a story worth reliving.",
    category: {
      name: "Photography & Videography",
      label: "Find Photographers",
    },
    centerIcon: Camera,
    orbitA: [Video, Star, Heart],
    orbitB: [Sparkles, Camera, Gem, Crown],
    card: {
      icon: Camera,
      title: "Cinematic coverage",
      text: "Photos, films & drone shots",
    },
    from: "oklch(0.46 0.18 300)",
    via: "oklch(0.3 0.12 290)",
    to: "oklch(0.17 0.06 280)",
    glow: "oklch(0.7 0.18 320 / 50%)",
    a1: "oklch(0.92 0.09 320)",
    a2: "oklch(0.9 0.1 20)",
  },
  {
    id: "style",
    label: "Style",
    eyebrow: "Decor, florals & styling",
    title: ["Style, Bloom &", "Celebrate in", "Elegance"],
    highlight: 2,
    description:
      "Dreamy stages, fresh florals, bridal looks and outfits, everything that makes your celebration unforgettable.",
    category: { name: "Decoration & Florist", label: "Explore Decor" },
    centerIcon: Flower2,
    orbitA: [Palette, Shirt, Sparkles],
    orbitB: [Cake, Heart, Gem, Flower2],
    card: {
      icon: Sparkles,
      title: "Bridal & groom looks",
      text: "Makeup, styling & fashion",
    },
    from: "oklch(0.56 0.18 358)",
    via: "oklch(0.34 0.12 345)",
    to: "oklch(0.19 0.06 335)",
    glow: "oklch(0.78 0.16 5 / 50%)",
    a1: "oklch(0.93 0.07 5)",
    a2: "oklch(0.9 0.1 70)",
  },
];

const QUICK_CATEGORIES = [
  "Photography & Videography",
  "Wedding Venues",
  "Decoration & Florist",
  "Catering Services",
];

// Helpers
/** Layer that drifts with the mouse (depth in px). */
function Layer({
  mx,
  my,
  depth,
  className,
  children,
}: {
  mx: MotionValue<number>;
  my: MotionValue<number>;
  depth: number;
  className?: string;
  children?: ReactNode;
}) {
  const x = useTransform(mx, [-0.5, 0.5], [-depth, depth]);
  const y = useTransform(my, [-0.5, 0.5], [-depth, depth]);

  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
}

/* Deterministic petal data (no Math.random, so no hydration mismatch) */
const PETALS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 10 + ((i * 7) % 14),
  dur: 11 + ((i * 3) % 9),
  delay: (i * 0.9) % 7,
  sway: 30 + ((i * 11) % 40),
  opacity: 0.25 + ((i * 13) % 35) / 100,
}));

function Petals() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {PETALS.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0 block rounded-[100%_0_100%_0] bg-linear-to-br from-white to-pink-200"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.25,
            opacity: p.opacity,
          }}
          initial={{ y: "-12vh" }}
          animate={{
            y: "112vh",
            rotate: [0, 200, 400],
            x: [0, p.sway, -p.sway, 0],
          }}
          transition={{
            y: {
              duration: p.dur,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            },
            rotate: {
              duration: p.dur,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            },
            x: {
              duration: p.dur / 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            },
          }}
        />
      ))}
    </div>
  );
}

// Headline (word-by-word reveal)
function Headline({ slide }: { slide: Slide }) {
  return (
    <h1 className="font-serif text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl xl:text-7xl">
      {slide.title.map((line, li) => (
        <span key={li} className="block overflow-hidden pb-[0.14em]">
          {line.split(" ").map((word, wi) => (
            <motion.span
              key={wi}
              className={`mr-[0.25em] inline-block ${li === slide.highlight ? "bg-clip-text text-transparent" : ""}`}
              style={
                li === slide.highlight
                  ? {
                      backgroundImage: `linear-gradient(90deg, ${slide.a1}, ${slide.a2})`,
                    }
                  : undefined
              }
              initial={{ y: "115%", rotate: 5, opacity: 0 }}
              animate={{ y: "0%", rotate: 0, opacity: 1 }}
              exit={{
                y: "-115%",
                opacity: 0,
                transition: { duration: 0.25, delay: li * 0.03 },
              }}
              transition={{
                type: "spring",
                stiffness: 110,
                damping: 16,
                delay: 0.2 + li * 0.13 + wi * 0.07,
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

// Orbit visual (right side)
function Chip({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/25 bg-white/15 text-white shadow-lg shadow-black/10 backdrop-blur-md">
      <Icon className="h-5 w-5" />
    </span>
  );
}

function OrbitRing({
  radius,
  duration,
  reverse,
  icons,
}: {
  radius: number;
  duration: number;
  reverse?: boolean;
  icons: LucideIcon[];
}) {
  const dir = reverse ? -1 : 1;

  return (
    <div className="absolute inset-0 grid place-items-center">
      <motion.div
        className="relative rounded-full border border-dashed border-white/25"
        style={{ width: radius * 2, height: radius * 2 }}
        animate={{ rotate: 360 * dir }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {icons.map((Icon, i) => {
          const angle = (360 / icons.length) * i;

          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `translate(-50%,-50%) rotate(${angle}deg) translateY(-${radius}px) rotate(${-angle}deg)`,
              }}
            >
              {/* counter-spin keeps the icon upright */}
              <motion.div
                animate={{ rotate: -360 * dir }}
                transition={{ duration, repeat: Infinity, ease: "linear" }}
              >
                <Chip icon={Icon} />
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

function OrbitVisual({
  slide,
  mx,
  my,
}: {
  slide: Slide;
  mx: MotionValue<number>;
  my: MotionValue<number>;
}) {
  const Center = slide.centerIcon;
  const Card = slide.card.icon;

  return (
    <Layer
      mx={mx}
      my={my}
      depth={18}
      className="relative mx-auto hidden aspect-square w-full max-w-117.5 lg:block"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          className="absolute inset-0"
          initial={{
            opacity: 0,
            scale: 0.8,
            rotate: -10,
            filter: "blur(10px)",
          }}
          animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
          exit={{
            opacity: 0,
            scale: 1.1,
            rotate: 8,
            filter: "blur(8px)",
            transition: { duration: 0.3 },
          }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 16,
            delay: 0.15,
          }}
        >
          {/* glow */}
          <div
            className="absolute inset-[12%] rounded-full blur-3xl"
            style={{ background: slide.glow }}
          />

          <OrbitRing radius={138} duration={26} icons={slide.orbitA} />

          <OrbitRing radius={208} duration={38} reverse icons={slide.orbitB} />

          {/* centre orb */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative grid h-36 w-36 place-items-center">
              {[0, 1].map((n) => (
                <motion.span
                  key={n}
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-white/40"
                  animate={{ scale: [1, 1.9], opacity: [0.5, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: n * 1.5,
                    ease: "easeOut",
                  }}
                />
              ))}

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="grid h-full w-full place-items-center rounded-full border border-white/40 bg-linear-to-br from-white/35 to-white/5 text-white shadow-2xl shadow-black/20 backdrop-blur-xl"
              >
                <Center
                  className="h-14 w-14 drop-shadow-lg"
                  strokeWidth={1.5}
                />
              </motion.div>
            </div>
          </div>

          {/* floating glass card */}
          <motion.div
            className="absolute -left-2 bottom-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.6,
              type: "spring",
              stiffness: 120,
              damping: 16,
            }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/15 px-4 py-3 shadow-xl backdrop-blur-xl"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/90 text-neutral-900">
                <Card className="h-5 w-5" />
              </span>

              <div className="text-sm leading-tight">
                <p className="font-semibold">{slide.card.title}</p>
                <p className="text-xs text-white/75">{slide.card.text}</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Layer>
  );
}

// Banner
export default function HeroBanner() {
  const reduce = useReducedMotion();
  const N = SLIDES.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const progress = useMotionValue(0);
  const slide = SLIDES[index];

  /* Mouse parallax + spotlight */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 18 });
  const smy = useSpring(my, { stiffness: 60, damping: 18 });
  const px = useMotionValue(600);
  const py = useMotionValue(300);
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${px}px ${py}px, rgba(255,255,255,0.13), transparent 62%)`;

  const goTo = useCallback(
    (to: number) => {
      progress.set(0);
      setIndex(((to % N) + N) % N);
    },
    [N, progress],
  );

  /* Autoplay: progress bar drives the slide change; pause keeps position */
  useEffect(() => {
    if (paused || reduce) return;

    const remaining = DURATION * (1 - progress.get());

    const controls = animate(progress, 1, {
      duration: Math.max(remaining, 0.01),
      ease: "linear",
      onComplete: () => goTo(index + 1),
    });

    return () => controls.stop();
  }, [paused, reduce, index, goTo, progress]);

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;

    px.set(x);
    py.set(y);
    mx.set(x / r.width - 0.5);
    my.set(y / r.height - 0.5);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") goTo(index + 1);
    if (e.key === "ArrowLeft") goTo(index - 1);
  };

  const bg = `radial-gradient(ellipse at 18% 22%, ${slide.glow}, transparent 55%), linear-gradient(135deg, ${slide.from}, ${slide.via} 52%, ${slide.to})`;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="WedPlan highlights"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onMouseMove={onMouseMove}
      className="relative isolate min-h-svh overflow-hidden bg-neutral-950 text-white outline-none"
    >
      {/* Backgrounds */}
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.id}
          aria-hidden
          className="absolute inset-0 -z-30"
          style={{ background: bg }}
          initial={{ clipPath: "circle(0% at 72% 52%)" }}
          animate={{ clipPath: "circle(150% at 72% 52%)" }}
          exit={{ opacity: 0.999, transition: { duration: 1.2 } }}
          transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
        >
          {slide.image && (
            <>
              <motion.img
                src={slide.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                initial={{ scale: 1.18 }}
                animate={{ scale: 1 }}
                transition={{ duration: DURATION + 2, ease: "linear" }}
              />

              <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-black/10" />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* texture + depth */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 opacity-50 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] bg-size-[26px_26px] mask-[radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]"
      />

      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-20 h-44 bg-linear-to-b from-black/35 to-transparent"
      />

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-20 h-56 bg-linear-to-t from-black/45 to-transparent"
      />

      {/* parallax decorative layers */}
      <Layer
        mx={smx}
        my={smy}
        depth={40}
        className="absolute -right-32 -top-32 -z-10 h-136 w-136"
      >
        <motion.div
          className="h-full w-full rounded-full border-[3px] border-white/10"
          animate={{ rotate: 360 }}
          transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        />
      </Layer>

      <Layer
        mx={smx}
        my={smy}
        depth={26}
        className="absolute -bottom-40 -left-24 -z-10 h-120 w-120"
      >
        <motion.div
          className="h-full w-full rounded-full border-[3px] border-white/10"
          animate={{ rotate: -360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        />
      </Layer>

      <Layer
        mx={smx}
        my={smy}
        depth={60}
        className="absolute left-[8%] top-[22%] -z-10 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, -16, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
        >
          <Heart className="h-8 w-8 fill-white/20 text-white/30" />
        </motion.div>
      </Layer>

      <Layer
        mx={smx}
        my={smy}
        depth={50}
        className="absolute bottom-[26%] right-[46%] -z-10 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 14, 0], rotate: [0, -12, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          <Sparkles className="h-7 w-7 text-white/30" />
        </motion.div>
      </Layer>

      {/* cursor spotlight */}
      <motion.div
        aria-hidden
        style={{ background: spotlight }}
        className="pointer-events-none absolute inset-0 -z-10"
      />

      {!reduce && <Petals />}

      {/* Content */}
      <motion.div
        onPanEnd={(_, info) => {
          if (info.offset.x < -80) goTo(index + 1);
          else if (info.offset.x > 80) goTo(index - 1);
        }}
        className="relative mx-auto grid min-h-svh max-w-7xl touch-pan-y items-center gap-10 px-4 pb-36 pt-32 sm:px-6 lg:grid-cols-2 lg:px-8"
      >
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              {/* eyebrow */}
              <motion.span
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-md"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {slide.eyebrow}
              </motion.span>

              <div className="mt-6">
                <Headline slide={slide} />
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.5 }}
                className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg"
              >
                {slide.description}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="mt-9 flex flex-wrap items-center gap-3"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Link
                    href="/services"
                    className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-neutral-900 shadow-2xl shadow-black/30"
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

                {slide.category && (
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Link
                      href={`/services?category=${encodeURIComponent(slide.category.name)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-semibold backdrop-blur-md transition-colors hover:bg-white/20"
                    >
                      {slide.category.label}
                    </Link>
                  </motion.div>
                )}
              </motion.div>

              {/* quick category chips */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: { staggerChildren: 0.07, delayChildren: 1.1 },
                  },
                }}
                className="mt-8 hidden flex-wrap items-center gap-2 sm:flex"
              >
                <span className="mr-1 text-xs uppercase tracking-widest text-white/60">
                  Popular
                </span>

                {QUICK_CATEGORIES.map((c) => (
                  <motion.div
                    key={c}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0 },
                    }}
                    whileHover={{ y: -3 }}
                  >
                    <Link
                      href={`/services?category=${encodeURIComponent(c)}`}
                      className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs backdrop-blur transition-colors hover:border-white/50 hover:bg-white/20"
                    >
                      {c}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <OrbitVisual slide={slide} mx={smx} my={smy} />
      </motion.div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-4 pb-7 sm:px-6 lg:px-8">
          {/* tabs with progress */}
          <ol
            className="flex max-w-2xl flex-1 gap-3 sm:gap-5"
            aria-label="Slides"
          >
            {SLIDES.map((s, i) => (
              <li key={s.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}: ${s.label}`}
                  aria-current={i === index}
                  className="group w-full py-2 text-left"
                >
                  <div className="h-0.75 overflow-hidden rounded-full bg-white/25">
                    <motion.div
                      className="h-full origin-left rounded-full bg-white"
                      style={{
                        scaleX: i === index ? progress : i < index ? 1 : 0,
                      }}
                    />
                  </div>

                  <div className="mt-2.5 hidden items-center gap-2 text-xs sm:flex">
                    <span className="font-mono opacity-60">0{i + 1}</span>

                    <span
                      className={`font-medium uppercase tracking-wider transition-opacity ${
                        i === index
                          ? "opacity-100"
                          : "opacity-55 group-hover:opacity-100"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ol>

          {/* arrows + counter */}
          <div className="flex items-center gap-4">
            <div
              className="hidden items-baseline gap-1 font-serif sm:flex"
              aria-live="polite"
            >
              <span className="relative inline-flex h-9 w-8 overflow-hidden text-3xl font-semibold">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={index}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 22 }}
                    className="absolute inset-0"
                  >
                    0{index + 1}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="text-sm text-white/50">/ 0{N}</span>
            </div>

            <div className="flex gap-2">
              {[
                { dir: -1, icon: ArrowLeft, label: "Previous slide" },
                { dir: 1, icon: ArrowRight, label: "Next slide" },
              ].map(({ dir, icon: Icon, label }) => (
                <motion.button
                  key={label}
                  type="button"
                  aria-label={label}
                  onClick={() => goTo(index + dir)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="grid h-12 w-12 place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md transition-colors hover:bg-white hover:text-neutral-900"
                >
                  <Icon className="h-5 w-5" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
