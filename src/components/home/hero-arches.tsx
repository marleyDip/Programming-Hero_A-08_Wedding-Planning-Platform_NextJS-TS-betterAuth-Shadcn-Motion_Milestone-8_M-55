"use client";

/**
 * WedPlan - "Arches" hero banner (alternative design)
 * Place at: components/home/hero-arches.tsx   ->   <HeroArches /> at the top of app/page.tsx
 *
 * Concept: a bright, editorial hero (follows light/dark theme) built around four
 * wedding-arch panels that expand on hover / tap. Includes a working search card
 * that sends visitors to /services?category=...&location=...&date=...
 *
 * Motion & interaction
 *  - Arch accordion: hover (desktop) or tap (mobile) expands a panel with a spring;
 *    auto-cycles every 4.5s and pauses while you interact
 *  - Hand-drawn underline that draws itself under a headline word
 *  - Word-by-word headline reveal, count-up stats (when scrolled into view)
 *  - Floating glass chips, shimmering search button, scrolling category marquee
 *  - Pointer parallax on the decorative blobs
 *  - Fully responsive: stacked on phones, split layout from lg up
 *  - Respects prefers-reduced-motion
 *
 * Optional: give any panel a real photo with `image: "/arch-1.jpg"` in PANELS.
 * No image files are required.
 */

import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Flower2,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

// CONFIG
interface Panel {
  category: string;
  title: string;
  text: string;
  tags: string[];
  icon: LucideIcon;
  from: string;
  to: string;
  image?: string;
}

const PANELS: Panel[] = [
  {
    category: "Wedding Venues",
    title: "Venues",
    text: "Halls, gardens and beachside resorts for every guest list.",
    tags: ["Banquet halls", "Gardens", "Resorts"],
    icon: Building2,
    from: "oklch(0.72 0.14 30)",
    to: "oklch(0.55 0.2 12)",
  },
  {
    category: "Photography & Videography",
    title: "Photography",
    text: "Timeless portraits and cinematic films of your big day.",
    tags: ["Pre-wedding", "Cinematic film", "Drone"],
    icon: Camera,
    from: "oklch(0.7 0.14 300)",
    to: "oklch(0.5 0.2 285)",
  },
  {
    category: "Decoration & Florist",
    title: "Decor & Florals",
    text: "Dreamy stages, floral arches and glowing ambience.",
    tags: ["Stage design", "Florals", "Lighting"],
    icon: Flower2,
    from: "oklch(0.82 0.12 80)",
    to: "oklch(0.62 0.16 45)",
  },
  {
    category: "Catering Services",
    title: "Catering",
    text: "Menus crafted for every taste, tradition and headcount.",
    tags: ["Traditional", "Live counters", "Desserts"],
    icon: UtensilsCrossed,
    from: "oklch(0.74 0.14 160)",
    to: "oklch(0.5 0.12 175)",
  },
];

const CITIES = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Cox's Bazar",
];

/** Replace with your real numbers. */
const STATS = [
  { value: 2500, suffix: "+", label: "Verified vendors" },
  { value: 12000, suffix: "+", label: "Happy couples" },
  { value: 4.9, suffix: "", label: "Average rating", decimals: 1 },
];

const MARQUEE = [
  "Photography & Videography",
  "Wedding Venues",
  "Decoration & Florist",
  "Catering Services",
  "Makeup & Styling",
  "Wedding Fashion",
];

// Small pieces
function CountUp({
  to,
  decimals = 0,
  suffix = "",
}: {
  to: number;
  decimals?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;

    const fmt = (v: number) =>
      v.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

    if (reduce) {
      el.textContent = fmt(to) + suffix;
      return;
    }

    const controls = animate(0, to, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => (el.textContent = fmt(v) + suffix),
    });

    return () => controls.stop();
  }, [inView, to, decimals, suffix, reduce]);

  return <span ref={ref}>0{suffix}</span>;
}

/** Underline that draws itself. */
function Squiggle() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 18"
      preserveAspectRatio="none"
      className="absolute -bottom-2 left-0 h-3 w-full text-(--logo-to) sm:h-4"
    >
      <motion.path
        d="M3 12 C 40 2, 70 18, 110 9 S 180 2, 220 10 S 275 14, 297 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 1.1, duration: 1.1, ease: "easeInOut" }}
      />
    </svg>
  );
}

function Headline() {
  const lines: { words: string[]; accent?: number }[] = [
    { words: ["Where", "every"] },
    { words: ["love", "story"], accent: 1 },
    { words: ["finds", "its", "team."] },
  ];

  return (
    <h1 className="font-serif text-[2.7rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl xl:text-7xl">
      {lines.map((line, li) => (
        <span key={li} className="block overflow-hidden pb-[0.12em]">
          {line.words.map((w, wi) => (
            <motion.span
              key={wi}
              initial={{ y: "115%", rotate: 4 }}
              animate={{ y: "0%", rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 110,
                damping: 16,
                delay: 0.15 + li * 0.12 + wi * 0.07,
              }}
              className="mr-[0.22em] inline-block"
            >
              {line.accent === wi ? (
                <span className="relative inline-block">
                  <span className="bg-linear-to-r from-(--logo-from) to-(--logo-to) bg-clip-text italic text-transparent">
                    {w}
                  </span>
                  <Squiggle />
                </span>
              ) : (
                w
              )}
            </motion.span>
          ))}
        </span>
      ))}
    </h1>
  );
}

// Search card
function SelectField({
  icon: Icon,
  label,
  value,
  onChange,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="group relative flex flex-1 cursor-pointer items-center gap-3 rounded-2xl px-4 py-2.5 transition-colors hover:bg-accent/60 focus-within:bg-accent/60">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer appearance-none bg-transparent pr-5 text-sm font-medium text-foreground outline-none"
        >
          {children}
        </select>
      </span>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
    </label>
  );
}

function SearchCard({
  category,
  onCategory,
}: {
  category: string;
  onCategory: (c: string) => void;
}) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();

    if (category) p.set("category", category);
    if (city) p.set("location", city);
    if (date) p.set("date", date);

    router.push(`/services${p.toString() ? `?${p}` : ""}`);
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.85, type: "spring", stiffness: 110, damping: 18 }}
      className="relative rounded-3xl border border-border bg-card/85 p-2 shadow-2xl shadow-brand/10 backdrop-blur-xl"
    >
      <div className="flex flex-col gap-1 lg:flex-row lg:items-center">
        <SelectField
          icon={Sparkles}
          label="Service"
          value={category}
          onChange={onCategory}
        >
          <option value="">All services</option>
          {PANELS.map((p) => (
            <option key={p.category} value={p.category}>
              {p.category}
            </option>
          ))}
        </SelectField>

        <span className="mx-1 hidden h-8 w-px bg-border lg:block" />

        <SelectField icon={MapPin} label="City" value={city} onChange={setCity}>
          <option value="">Anywhere</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>

        <span className="mx-1 hidden h-8 w-px bg-border lg:block" />

        <label className="group relative flex flex-1 cursor-pointer items-center gap-3 rounded-2xl px-4 py-2.5 transition-colors hover:bg-accent/60 focus-within:bg-accent/60">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
            <Calendar className="h-4 w-4" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Wedding date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-foreground outline-none scheme-light dark:scheme-dark"
            />
          </span>
        </label>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className="relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-linear-to-r from-(--logo-from) to-(--logo-to) px-7 text-sm font-semibold text-(--logo-fg) shadow-lg shadow-brand/30 lg:ml-1"
        >
          <motion.span
            aria-hidden
            className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/35"
            initial={{ left: "-40%" }}
            animate={{ left: "140%" }}
            transition={{
              duration: 1.3,
              repeat: Infinity,
              repeatDelay: 2.4,
              ease: "easeInOut",
            }}
          />

          <Search className="relative h-4 w-4" />
          <span className="relative">Search</span>
        </motion.button>
      </div>
    </motion.form>
  );
}

// Arch accordion
function ArchPanel({
  panel,
  index,
  active,
  onActivate,
}: {
  panel: Panel;
  index: number;
  active: boolean;
  onActivate: () => void;
}) {
  const Icon = panel.icon;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-expanded={active}
      aria-label={panel.title}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onActivate()}
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0, flexGrow: active ? 3.4 : 1 }}
      transition={{
        opacity: { delay: 0.35 + index * 0.12 },
        y: {
          delay: 0.35 + index * 0.12,
          type: "spring",
          stiffness: 90,
          damping: 16,
        },
        flexGrow: { type: "spring", stiffness: 120, damping: 20 },
      }}
      style={{
        background: `linear-gradient(165deg, ${panel.from}, ${panel.to})`,
        flexBasis: 0,
      }}
      className="group relative min-w-0 cursor-pointer overflow-hidden rounded-t-[999px] rounded-b-[1.75rem] text-white shadow-xl outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
    >
      {panel.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={panel.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-white/10" />

      {/* concentric arch outlines */}
      {[0.82, 0.62, 0.42].map((s, i) => (
        <motion.span
          key={s}
          aria-hidden
          className="absolute left-1/2 top-0 aspect-[1/1.6] -translate-x-1/2 rounded-t-[999px] border border-white/25"
          style={{ width: `${s * 100}%` }}
          animate={{ opacity: active ? 0.9 : 0.35, scale: active ? 1 : 0.96 }}
          transition={{ delay: i * 0.05 }}
        />
      ))}

      {/* icon medallion */}
      <motion.div
        className="absolute left-1/2 top-[14%] grid -translate-x-1/2 place-items-center rounded-full border border-white/40 bg-white/20 text-white shadow-lg backdrop-blur-md"
        animate={{
          width: active ? 76 : 48,
          height: active ? 76 : 48,
          y: active ? [0, -6, 0] : 0,
        }}
        transition={{
          width: { type: "spring", stiffness: 200, damping: 18 },
          height: { type: "spring", stiffness: 200, damping: 18 },
          y: active
            ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.2 },
        }}
      >
        <Icon className={active ? "h-8 w-8" : "h-5 w-5"} strokeWidth={1.6} />
      </motion.div>

      {/* collapsed label */}
      <AnimatePresence>
        {!active && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-[0.25em] [text-orientation:mixed] [writing-mode:vertical-rl] rotate-180"
          >
            {panel.title}
          </motion.span>
        )}
      </AnimatePresence>

      {/* expanded content */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.12 } }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="absolute inset-x-0 bottom-0 p-4 sm:p-6"
          >
            <h3 className="font-serif text-xl font-semibold leading-tight sm:text-2xl">
              {panel.title}
            </h3>

            <p className="mt-1.5 text-xs leading-relaxed text-white/85 sm:text-sm">
              {panel.text}
            </p>

            <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
              {panel.tags.map((t, i) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.06 }}
                  className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] backdrop-blur-sm"
                >
                  {t}
                </motion.span>
              ))}
            </div>

            <Link
              href={`/services?category=${encodeURIComponent(panel.category)}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-900 transition-transform hover:scale-105"
            >
              Explore <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ArchGallery({
  active,
  setActive,
}: {
  active: number;
  setActive: (i: number) => void;
}) {
  return (
    <div className="relative">
      <div className="flex h-100 items-end gap-2.5 sm:h-120 sm:gap-3.5 lg:h-150">
        {PANELS.map((p, i) => (
          <ArchPanel
            key={p.category}
            panel={p}
            index={i}
            active={active === i}
            onActivate={() => setActive(i)}
          />
        ))}
      </div>

      {/* floating chips */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 110, damping: 16 }}
        className="absolute -left-2 top-10 z-10 hidden sm:block lg:-left-8"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-xl backdrop-blur-xl"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success">
            <CheckCircle2 className="h-5 w-5" />
          </span>

          <div className="text-xs leading-tight">
            <p className="text-sm font-semibold text-foreground">
              Booking accepted
            </p>
            <p className="text-muted-foreground">Wedding Photography</p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, type: "spring", stiffness: 110, damping: 16 }}
        className="absolute -right-1 bottom-24 z-10 hidden sm:block lg:-right-6"
      >
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-xl backdrop-blur-xl"
        >
          <div className="flex gap-0.5 text-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
          </div>

          <p className="mt-1 text-sm font-semibold text-foreground">
            4.9 / 5 rating
          </p>

          <p className="text-xs text-muted-foreground">from real couples</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Marquee
function Marquee() {
  const reduce = useReducedMotion();
  const list = [...MARQUEE, ...MARQUEE];
  return (
    <div className="relative border-y border-border bg-card/50 py-4 backdrop-blur mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <motion.div
        className="flex w-max items-center gap-10"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
      >
        {list.map((m, i) => (
          <Link
            key={i}
            href={`/services?category=${encodeURIComponent(m)}`}
            className="flex items-center gap-10 whitespace-nowrap font-serif text-lg text-foreground/70 transition-colors hover:text-brand"
          >
            {m}
            <Heart className="h-3.5 w-3.5 fill-brand/60 text-brand/60" />
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

// Hero
export default function HeroArches() {
  const reduce = useReducedMotion();

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [category, setCategory] = useState("");

  /* Auto-cycle the arches */
  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(
      () => setActive((a) => (a + 1) % PANELS.length),
      4500,
    );

    return () => clearInterval(t);
  }, [paused, reduce]);

  /* Keep the search "Service" select in sync with the active arch */
  const activate = (i: number) => {
    setActive(i);
    setCategory(PANELS[i].category);
  };

  /* Pointer parallax for background blobs */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const sy = useSpring(my, { stiffness: 50, damping: 18 });
  const b1x = useTransform(sx, [-0.5, 0.5], [-40, 40]);
  const b1y = useTransform(sy, [-0.5, 0.5], [-30, 30]);
  const b2x = useTransform(sx, [-0.5, 0.5], [50, -50]);
  const b2y = useTransform(sy, [-0.5, 0.5], [40, -40]);

  return (
    <>
      <section
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative isolate overflow-hidden bg-background pb-16 pt-28 sm:pt-32 lg:pb-20 lg:pt-36"
      >
        {/* ambient background */}
        <motion.div
          aria-hidden
          style={{ x: b1x, y: b1y }}
          className="absolute -left-40 top-10 -z-10 h-120 w-120 rounded-full bg-brand/15 blur-3xl"
        />

        <motion.div
          aria-hidden
          style={{ x: b2x, y: b2y }}
          className="absolute -right-32 bottom-0 -z-10 h-128 w-lg rounded-full bg-gold/20 blur-3xl"
        />

        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60 bg-[radial-gradient(color-mix(in_oklab,var(--foreground)_13%,transparent)_1px,transparent_1px)] bg-size-[28px_28px] mask-[radial-gradient(ellipse_at_50%_30%,black,transparent_70%)]"
        />

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8">
          {/* Left */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand shadow-sm backdrop-blur"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              Wedding planning, made beautiful
            </motion.span>

            <div className="mt-6">
              <Headline />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Discover trusted photographers, venues, decorators and more.
              Compare services, pick your date and send booking requests in
              minutes.
            </motion.p>

            <div className="mt-8">
              <SearchCard
                category={category}
                onCategory={(c) => {
                  setCategory(c);
                  const i = PANELS.findIndex((p) => p.category === c);
                  if (i >= 0) setActive(i);
                }}
              />
            </div>

            {/* CTA + stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 }}
              className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-6"
            >
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <Link
                  href="/services"
                  className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-brand/50 hover:bg-brand-soft"
                >
                  Explore Wedding Services
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-brand-foreground transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </motion.div>

              <dl className="flex gap-7">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                      <CountUp
                        to={s.value}
                        decimals={s.decimals}
                        suffix={s.suffix}
                      />
                    </dd>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>

          {/* Right */}
          <ArchGallery active={active} setActive={activate} />
        </div>
      </section>

      <Marquee />
    </>
  );
}
