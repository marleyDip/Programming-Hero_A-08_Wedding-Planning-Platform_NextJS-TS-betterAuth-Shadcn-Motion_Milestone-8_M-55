"use client";

/**
 * WedPlan - Browse Services (analytics header + search & filter + results)
 * Place at: components/services/services-explorer.tsx   (rendered by app/services/page.tsx)
 * Needs: components/home/section-kit.tsx, components/ui/fancy-select.tsx, lib/services-api.ts
 *
 * TOP     Live "at a glance" graphs, calculated from the real services returned by the API:
 *         stat tiles, a services-per-category bar chart and a services-per-city donut.
 *         Clicking a bar / slice / legend item filters the list below.
 * MIDDLE  Search by name + 3D custom dropdowns: Category, Location (and Sort). Active filter
 *         chips, live result count and a reset button. State is kept in the URL
 *         (?q=&category=&location=&sort=) so filtered pages can be shared, and the homepage
 *         category / destination links work out of the box.
 * BOTTOM  3D tilt result cards (image, name, category, price, location, vendor, View Details),
 *         animated enter / exit as filters change, skeletons, error + retry, empty state.
 * Only approved + active services are ever shown (enforced in getAllServices).
 */

import {
  CountUp,
  SectionBackdrop,
  SectionHeading,
  useTilt,
} from "@/components/home/section-kit";
import FancySelect, { type SelectOption } from "@/components/ui/fancy-select";
import { getAllServices, type Service } from "@/lib/services-api";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpDown,
  ArrowUpRight,
  BarChart3,
  Building2,
  Camera,
  Flower2,
  LayoutGrid,
  MapPin,
  RefreshCw,
  Search,
  SearchX,
  Shirt,
  Sparkles,
  Star,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Look & feel per category
const CATEGORY_META: Record<
  string,
  { icon: LucideIcon; from: string; to: string }
> = {
  "Photography & Videography": {
    icon: Camera,
    from: "oklch(0.7 0.16 305)",
    to: "oklch(0.45 0.2 285)",
  },
  "Wedding Venues": {
    icon: Building2,
    from: "oklch(0.74 0.15 28)",
    to: "oklch(0.5 0.21 10)",
  },
  "Decoration & Florist": {
    icon: Flower2,
    from: "oklch(0.84 0.13 80)",
    to: "oklch(0.6 0.17 40)",
  },
  "Catering Services": {
    icon: UtensilsCrossed,
    from: "oklch(0.76 0.14 155)",
    to: "oklch(0.48 0.12 180)",
  },
  "Makeup & Styling": {
    icon: Sparkles,
    from: "oklch(0.78 0.16 350)",
    to: "oklch(0.5 0.22 335)",
  },
  "Wedding Fashion": {
    icon: Shirt,
    from: "oklch(0.72 0.19 20)",
    to: "oklch(0.46 0.2 0)",
  },
};

const FALLBACK = {
  icon: LayoutGrid,
  from: "oklch(0.72 0.14 230)",
  to: "oklch(0.46 0.16 255)",
};

const metaOf = (c: string) => CATEGORY_META[c] ?? FALLBACK;

const DONUT_COLORS = [
  "oklch(0.7 0.18 305)",
  "oklch(0.76 0.16 30)",
  "oklch(0.82 0.14 85)",
  "oklch(0.74 0.14 160)",
  "oklch(0.72 0.14 230)",
  "oklch(0.76 0.18 350)",
  "oklch(0.7 0.1 200)",
  "oklch(0.65 0.12 120)",
];

type SortKey = "rating" | "reviews" | "price-asc" | "price-desc";

const SORTS: SelectOption[] = [
  { value: "rating", label: "Top rated" },
  { value: "reviews", label: "Most reviewed" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

const money = (n: number) => `৳${n.toLocaleString("en-US")}`;

const compact = (n: number) =>
  n >= 1000 ? `৳${Math.round(n / 1000)}k` : `৳${n}`;

// Tilt wrapper used by chart panels
function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, reduce, style, glare, handlers } = useTilt(4, 12);

  return (
    <motion.div
      ref={ref}
      {...handlers}
      initial={reduce ? false : { opacity: 0, y: 40, rotateX: -14 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: "spring", stiffness: 90, damping: 16 }}
      style={style}
      className={`relative overflow-hidden rounded-3xl border border-border bg-card/90 p-6 shadow-xl backdrop-blur ${className}`}
    >
      <motion.div
        aria-hidden
        style={{ background: glare }}
        className="pointer-events-none absolute inset-0 opacity-70 mix-blend-soft-light"
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

// Analytics header
function Insights({
  services,
  category,
  location,
  onCategory,
  onLocation,
}: {
  services: Service[];
  category: string;
  location: string;
  onCategory: (c: string) => void;
  onLocation: (l: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const data = useMemo(() => {
    const byCat = new Map<string, number>();
    const byLoc = new Map<string, number>();

    let ratingSum = 0;
    let rated = 0;
    let min = Infinity;
    let max = 0;

    for (const s of services) {
      byCat.set(s.category, (byCat.get(s.category) ?? 0) + 1);

      byLoc.set(s.location, (byLoc.get(s.location) ?? 0) + 1);

      if (s.rating > 0) {
        ratingSum += s.rating;
        rated++;
      }

      min = Math.min(min, s.price);
      max = Math.max(max, s.price);
    }

    return {
      cats: [...byCat.entries()].sort((a, b) => b[1] - a[1]),
      locs: [...byLoc.entries()].sort((a, b) => b[1] - a[1]),

      avg: rated ? ratingSum / rated : 0,
      min: Number.isFinite(min) ? min : 0,
      max,
    };
  }, [services]);

  const total = services.length;
  const maxCat = Math.max(1, ...data.cats.map(([, n]) => n));

  const tiles = [
    { k: "Live services", v: <CountUp to={total} />, icon: LayoutGrid },
    {
      k: "Average rating",
      v: (
        <>
          {data.avg.toFixed(1)}
          <span className="text-lg text-muted-foreground"> / 5</span>
        </>
      ),
      icon: Star,
    },
    {
      k: "Price range",
      v: (
        <span className="text-2xl sm:text-3xl">
          {compact(data.min)}–{compact(data.max)}
        </span>
      ),
      icon: BarChart3,
    },
    { k: "Cities covered", v: <CountUp to={data.locs.length} />, icon: MapPin },
  ];

  // donut geometry (circumference normalised to 100)
  const slices = data.locs.map(([name, n], i) => {
    const pct = (n / total) * 100;

    const offset = -data.locs
      .slice(0, i)
      .reduce((sum, [, count]) => sum + (count / total) * 100, 0);

    const slice = {
      name,
      n,
      pct,
      offset,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    };

    return slice;
  });

  const focus = hover ?? (location || null);

  const focusSlice = slices.find((s) => s.name === focus);

  return (
    <div className="mt-14 space-y-6 perspective-[1500px]">
      {/* tiles */}
      <motion.dl
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {tiles.map((t) => (
          <motion.div
            key={t.k}
            variants={{
              hidden: { opacity: 0, y: 24, scale: 0.95 },
              show: { opacity: 1, y: 0, scale: 1 },
            }}
            whileHover={{ y: -5 }}
            className="relative overflow-hidden rounded-2xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur"
          >
            <t.icon
              aria-hidden
              className="absolute -bottom-3 -right-3 h-20 w-20 text-brand/10"
              strokeWidth={1.2}
            />

            <dd className="relative font-serif text-3xl font-semibold sm:text-4xl">
              {t.v}
            </dd>

            <dt className="relative mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t.k}
            </dt>
          </motion.div>
        ))}
      </motion.dl>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* bar chart */}
        <Panel>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-semibold">
                Services by category
              </h2>
              <p className="text-xs text-muted-foreground">
                Click a bar to filter the list below
              </p>
            </div>

            <BarChart3 className="h-5 w-5 text-brand" />
          </div>

          <ul className="space-y-3">
            {data.cats.map(([name, n], i) => {
              const m = metaOf(name);
              const active = category === name;
              const dim = category && !active;

              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => onCategory(active ? "" : name)}
                    aria-pressed={active}
                    className={`group block w-full rounded-xl p-1.5 text-left outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-brand ${dim ? "opacity-40 hover:opacity-80" : ""}`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 font-medium">
                        <m.icon
                          className="h-4 w-4 shrink-0"
                          style={{ color: m.to }}
                        />

                        <span className="truncate">{name}</span>
                      </span>

                      <span className="font-mono text-xs text-muted-foreground">
                        {n}
                      </span>
                    </div>

                    <div className="h-3.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(n / maxCat) * 100}%` }}
                        transition={{
                          type: "spring",
                          stiffness: 70,
                          damping: 16,
                          delay: 0.15 + i * 0.07,
                        }}
                        className="h-full rounded-full transition-[filter] group-hover:brightness-110"
                        style={{
                          background: `linear-gradient(90deg, ${m.from}, ${m.to})`,
                          boxShadow: active ? `0 0 14px ${m.to}` : undefined,
                        }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* donut */}
        <Panel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-semibold">
                Services by city
              </h2>
              <p className="text-xs text-muted-foreground">
                Click a slice or label to filter
              </p>
            </div>

            <MapPin className="h-5 w-5 text-brand" />
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
            <div className="relative h-44 w-44 shrink-0">
              <svg
                viewBox="0 0 42 42"
                className="h-full w-full -rotate-90"
                role="img"
                aria-label="Services by city"
              >
                <circle
                  cx="21"
                  cy="21"
                  r="15.9155"
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="5"
                />

                {slices.map((s, i) => (
                  <motion.circle
                    key={s.name}
                    cx="21"
                    cy="21"
                    r="15.9155"
                    fill="none"
                    stroke={s.color}
                    strokeLinecap="butt"
                    initial={{ strokeDasharray: "0 100", strokeWidth: 5 }}
                    animate={{
                      strokeDasharray: `${Math.max(s.pct - 0.8, 0.1)} ${100 - Math.max(s.pct - 0.8, 0.1)}`,
                      strokeWidth: focus === s.name ? 7 : 5,
                      opacity: focus && focus !== s.name ? 0.35 : 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 80,
                      damping: 16,
                      delay: i * 0.08,
                    }}
                    strokeDashoffset={s.offset}
                    className="cursor-pointer"
                    onPointerEnter={() => setHover(s.name)}
                    onPointerLeave={() => setHover(null)}
                    onClick={() =>
                      onLocation(location === s.name ? "" : s.name)
                    }
                  />
                ))}
              </svg>

              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="font-serif text-3xl font-semibold leading-none">
                    {focusSlice ? focusSlice.n : total}
                  </p>
                  <p className="mt-1 max-w-24 truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                    {focusSlice ? focusSlice.name : "services"}
                  </p>
                </div>
              </div>
            </div>

            <ul className="grid w-full gap-1.5 text-sm">
              {slices.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    onClick={() =>
                      onLocation(location === s.name ? "" : s.name)
                    }
                    onPointerEnter={() => setHover(s.name)}
                    onPointerLeave={() => setHover(null)}
                    aria-pressed={location === s.name}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-brand ${
                      location === s.name ? "bg-brand-soft font-semibold" : ""
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: s.color }}
                    />

                    <span className="min-w-0 flex-1 truncate">{s.name}</span>

                    <span className="font-mono text-xs text-muted-foreground">
                      {s.n}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// Result card
function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;

  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-gold/40 px-0.5 text-inherit">
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}

function ServiceCard({ s, q }: { s: Service; q: string }) {
  const { ref, reduce, style, glare, handlers } = useTilt(10, 22);
  const [imgOk, setImgOk] = useState(true);

  const m = metaOf(s.category);

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 40, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.9, transition: { duration: 0.18 } }
      }
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="perspective-distant"
    >
      <motion.article
        ref={ref}
        {...handlers}
        whileHover={reduce ? undefined : { y: -8 }}
        style={style}
        className="group relative h-full overflow-visible rounded-3xl border border-border bg-card shadow-lg transition-shadow duration-500 hover:shadow-2xl hover:shadow-brand/20"
      >
        {/* image */}
        <div className="relative aspect-4/3 overflow-hidden rounded-t-3xl">
          {imgOk ? (
            <Image
              src={s.image}
              alt={s.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImgOk(false)}
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div
              className="grid h-full w-full place-items-center text-white"
              style={{
                background: `linear-gradient(135deg, ${m.from}, ${m.to})`,
              }}
            >
              <m.icon className="h-14 w-14 opacity-80" strokeWidth={1.3} />
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />

          <motion.div
            aria-hidden
            style={{ background: glare }}
            className="absolute inset-0 mix-blend-soft-light"
          />
        </div>

        {/* floating chips */}
        <span
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${m.from}, ${m.to})`,
            transform: "translateZ(45px)",
          }}
        >
          <m.icon className="h-3.5 w-3.5" /> {s.category}
        </span>

        <span
          className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-white/30 bg-neutral-950/50 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md"
          style={{ transform: "translateZ(55px)" }}
        >
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />{" "}
          {s.rating.toFixed(1)}
          <span className="font-normal text-white/70">({s.reviewCount})</span>
        </span>

        <span
          className="absolute right-4 top-[calc(75%-1.25rem)] rounded-2xl bg-card px-3.5 py-2 text-right shadow-xl ring-1 ring-border"
          style={{ transform: "translateZ(65px)" }}
        >
          <span className="block text-base font-bold leading-tight text-brand">
            {money(s.price)}
          </span>

          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
            {s.priceType}
          </span>
        </span>

        {/* body */}
        <div className="p-5 pt-6">
          <h3
            className="line-clamp-2 min-h-[3.2rem] pr-24 font-serif text-lg font-semibold leading-snug"
            style={{ transform: "translateZ(30px)" }}
          >
            <Highlight text={s.name} q={q} />
          </h3>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-brand" /> {s.location}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex min-w-0 items-center gap-2.5">
              {s.vendor.image ? (
                <Image
                  src={s.vendor.image}
                  alt={s.vendor.name || ""}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                  {s.vendor.businessName.slice(0, 1)}
                </span>
              )}

              <span className="min-w-0 text-xs">
                <span className="block truncate font-semibold">
                  {s.vendor.businessName}
                </span>
                <span className="block truncate text-muted-foreground">
                  {s.vendor.name}
                </span>
              </span>
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ transform: "translateZ(40px)" }}
            >
              <Link
                href={`/services/${s.id}`}
                className="group/btn relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to) px-4 py-2.5 text-xs font-semibold text-(--logo-fg) shadow-md shadow-brand/30"
              >
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/35"
                  initial={{ left: "-40%" }}
                  animate={{ left: "140%" }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                />

                <span className="relative">View Details</span>
                <ArrowUpRight className="relative h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.article>
    </motion.li>
  );
}

function CardSkeleton() {
  return (
    <li className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="aspect-4/3 animate-pulse bg-muted" />

      <div className="space-y-3 p-5">
        <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="h-9 w-32 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </li>
  );
}

// Page body
export default function ServicesExplorer() {
  const params = useSearchParams();
  const reduce = useReducedMotion();

  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "");
  const [sort, setSort] = useState<SortKey>(
    (params.get("sort") as SortKey) || "rating",
  );
  const query = useDeferredValue(q.trim());

  const load = useCallback((signal?: AbortSignal) => {
    getAllServices(signal)
      .then((result) => {
        setError(null);
        setServices(result);
      })
      .catch((e) => {
        if (e?.name !== "AbortError")
          setError("We couldn't load services right now.");
      });
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);

    return () => ctrl.abort();
  }, [load]);

  /* URL <-> state */
  const written = useRef(params.toString());
  const paramStr = params.toString();
  useEffect(() => {
    if (paramStr === written.current) return;
    // the URL changed from outside (e.g. a navbar / homepage link): follow it
    written.current = paramStr;

    const p = new URLSearchParams(paramStr);
    setQ(p.get("q") ?? "");
    setCategory(p.get("category") ?? "");
    setLocation(p.get("location") ?? "");
    setSort((p.get("sort") as SortKey) || "rating");
  }, [paramStr]);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams();

      if (q.trim()) p.set("q", q.trim());
      if (category) p.set("category", category);
      if (location) p.set("location", location);
      if (sort !== "rating") p.set("sort", sort);
      const str = p.toString();
      if (str === written.current) return;

      written.current = str;
      window.history.replaceState(
        null,
        "",
        str ? `?${str}` : window.location.pathname,
      );
    }, 250);

    return () => clearTimeout(t);
  }, [q, category, location, sort]);

  /* options */
  const categoryOptions = useMemo<SelectOption[]>(() => {
    const counts = new Map<string, number>();
    (services ?? []).forEach((s) =>
      counts.set(s.category, (counts.get(s.category) ?? 0) + 1),
    );
    const names = new Set([...Object.keys(CATEGORY_META), ...counts.keys()]);

    if (category) names.add(category);

    return [
      {
        value: "",
        label: "All categories",
        count: services?.length,
        icon: LayoutGrid,
      },
      ...[...names].map((n) => ({
        value: n,
        label: n,
        count: counts.get(n) ?? 0,
        icon: metaOf(n).icon,
      })),
    ];
  }, [services, category]);

  const locationOptions = useMemo<SelectOption[]>(() => {
    const counts = new Map<string, number>();
    (services ?? []).forEach((s) =>
      counts.set(s.location, (counts.get(s.location) ?? 0) + 1),
    );

    if (location && !counts.has(location)) counts.set(location, 0);

    return [
      {
        value: "",
        label: "All locations",
        count: services?.length,
        icon: MapPin,
      },
      ...[...counts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([n, c]) => ({ value: n, label: n, count: c, icon: MapPin })),
    ];
  }, [services, location]);

  /* filter & sort */
  const results = useMemo(() => {
    if (!services) return [];

    const needle = query.toLowerCase();
    const list = services.filter(
      (s) =>
        (!needle || s.name.toLowerCase().includes(needle)) &&
        (!category || s.category === category) &&
        (!location || s.location === location),
    );

    const by: Record<SortKey, (a: Service, b: Service) => number> = {
      rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
      reviews: (a, b) => b.reviewCount - a.reviewCount,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
    };

    return [...list].sort(by[sort] ?? by.rating);
  }, [services, query, category, location, sort]);

  const filtered = !!(q.trim() || category || location);
  const reset = () => {
    setQ("");
    setCategory("");
    setLocation("");
    setSort("rating");
  };

  return (
    <div className="relative isolate overflow-hidden pb-24 pt-16 sm:pt-20">
      <SectionBackdrop />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Browse services"
          words={["Find Your Perfect"]}
          accent="Wedding Services"
          subtitle="Compare approved, active vendors across photography, venues, decor, catering, styling and fashion, all in one place."
        />

        {/* analytics */}
        {services && services.length > 0 && (
          <Insights
            services={services}
            category={category}
            location={location}
            onCategory={setCategory}
            onLocation={setLocation}
          />
        )}

        {services === null && !error && (
          <div className="mt-14 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div className="h-72 animate-pulse rounded-3xl bg-muted" />
            <div className="h-72 animate-pulse rounded-3xl bg-muted" />
          </div>
        )}

        {/* search & filter */}
        <motion.section
          aria-label="Search and filter services"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="relative z-20 mt-14 rounded-4xl border border-border bg-card/90 p-5 shadow-2xl shadow-brand/10 backdrop-blur-xl sm:p-7"
        >
          <div className="grid gap-4 lg:grid-cols-12">
            {/* search */}
            <div className="lg:col-span-12">
              <label
                htmlFor="svc-search"
                className="mb-1.5 block px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
              >
                Search by name
              </label>
              <div className="group relative">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand" />
                <input
                  id="svc-search"
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="e.g. cinematic film, bridal makeup, garden venue…"
                  autoComplete="off"
                  className="h-14 w-full rounded-2xl border border-border bg-background pl-14 pr-12 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/70 focus:border-brand focus:ring-4 focus:ring-brand/20 [&::-webkit-search-cancel-button]:hidden"
                  style={{ boxShadow: "inset 0 2px 6px rgba(0,0,0,0.08)" }}
                />

                <AnimatePresence>
                  {q && (
                    <motion.button
                      type="button"
                      aria-label="Clear search"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      onClick={() => setQ("")}
                      className="absolute right-4 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-brand hover:text-brand-foreground"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <FancySelect
              className="sm:col-span-1 lg:col-span-4"
              label="Category"
              icon={LayoutGrid}
              value={category}
              onChange={setCategory}
              options={categoryOptions}
            />

            <FancySelect
              className="sm:col-span-1 lg:col-span-4"
              label="Location"
              icon={MapPin}
              value={location}
              onChange={setLocation}
              options={locationOptions}
            />

            <FancySelect
              className="lg:col-span-4"
              label="Sort by"
              icon={ArrowUpDown}
              value={sort}
              onChange={(v) => setSort(v as SortKey)}
              options={SORTS}
            />
          </div>

          {/* chips & count */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {services ? (
                <>
                  Showing <b className="text-foreground">{results.length}</b> of{" "}
                  {services.length} services
                </>
              ) : (
                "Loading services…"
              )}
            </p>

            <AnimatePresence>
              {[
                q.trim() && {
                  k: "q",
                  label: `“${q.trim()}”`,
                  clear: () => setQ(""),
                },
                category && {
                  k: "c",
                  label: category,
                  clear: () => setCategory(""),
                },
                location && {
                  k: "l",
                  label: location,
                  clear: () => setLocation(""),
                },
              ]
                .filter(Boolean)
                .map((c) => {
                  const chip = c as {
                    k: string;
                    label: string;
                    clear: () => void;
                  };

                  return (
                    <motion.button
                      key={chip.k}
                      layout
                      type="button"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      onClick={chip.clear}
                      aria-label={`Remove filter ${chip.label}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-brand-foreground"
                    >
                      {chip.label} <X className="h-3 w-3" />
                    </motion.button>
                  );
                })}
            </AnimatePresence>

            {filtered && (
              <button
                type="button"
                onClick={reset}
                className="ml-auto text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Reset all
              </button>
            )}
          </div>
        </motion.section>

        {/* results */}
        <div className="relative z-0 mt-10">
          {error ? (
            <div className="mx-auto max-w-md rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="font-semibold text-destructive">{error}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check that the API is running, then try again.
              </p>

              <button
                type="button"
                onClick={() => load()}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"
              >
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            </div>
          ) : services === null ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </ul>
          ) : results.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-md rounded-3xl border border-dashed border-border bg-card/70 p-10 text-center"
            >
              <motion.div
                animate={reduce ? undefined : { rotate: [-8, 8, -8] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand"
              >
                <SearchX className="h-8 w-8" />
              </motion.div>

              <h3 className="mt-5 font-serif text-xl font-semibold">
                No services match
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Try a different name, or clear a filter to see more.
              </p>

              <button
                type="button"
                onClick={reset}
                className="mt-5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"
              >
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <motion.ul
              layout={!reduce}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {results.map((s) => (
                  <ServiceCard key={s.id} s={s} q={query} />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </div>
    </div>
  );
}
