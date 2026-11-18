"use client";

/**
 * WedPlan - Featured Wedding Services (3D cards)
 * Place at: components/home/featured-services.tsx   ->   <FeaturedServices /> on the homepage
 * Needs:    lib/services-api.ts  and  NEXT_PUBLIC_API_URL (see db.json notes)
 *
 * Shows 6 services that are APPROVED and ACTIVE, fetched from the API.
 * Card data: image, name, category, price, location, vendor info, View Details button.
 *
 * 3D / motion
 *  - Cards rise into place with a 3D flip as they scroll into view (staggered)
 *  - Mouse tilt with perspective + moving glare; layers sit at different depths
 *    (category pill, rating, price badge and vendor chip float in front of the photo)
 *  - Image zoom, shimmering "View Details" button, animated underline heading
 *  - Loading skeletons, error + retry, empty state; theme-aware (light / dark)
 *  - Touch devices skip tilt (reveal + hover-free layout still looks premium)
 *  - Respects prefers-reduced-motion
 */

import { getFeaturedServices, type Service } from "@/lib/services-api";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Camera,
  Crown,
  Flower2,
  Heart,
  MapPin,
  RefreshCw,
  Shirt,
  Sparkles,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const COUNT = 6;

/* Category look & feel (also used as the fallback when an image fails to load) */
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

const FALLBACK_META = CATEGORY_META["Wedding Venues"];

const money = new Intl.NumberFormat("en-BD");

// Card
function VendorAvatar({
  name,
  image,
}: {
  name: string;
  image?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return image && !failed ? (
    <Image
      src={image}
      alt={name}
      width={40}
      height={40}
      sizes="40px"
      onError={() => setFailed(true)}
      className="h-10 w-10 rounded-full object-cover ring-2 ring-brand/40"
    />
  ) : (
    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand ring-2 ring-brand/30">
      {initials}
    </span>
  );
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const reduce = useReducedMotion();
  const meta = CATEGORY_META[service.category] ?? FALLBACK_META;
  const Icon = meta.icon;
  const [imgFailed, setImgFailed] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const rx = useSpring(tx, { stiffness: 170, damping: 17 });
  const ry = useSpring(ty, { stiffness: 170, damping: 17 });
  const gx = useMotionValue(30);
  const gy = useMotionValue(20);

  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.4), transparent 55%)`;

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;

    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ty.set((px - 0.5) * 16);
    tx.set((0.5 - py) * 16);
    gx.set(px * 100);
    gy.set(py * 100);
  };
  const onLeave = () => {
    tx.set(0);
    ty.set(0);
    gx.set(30);
    gy.set(20);
  };

  const isPremium = service.vendor.subscriptionPlan === "premium";
  const href = `/services/${service.id}`;

  return (
    <motion.li
      initial={
        reduce ? false : { opacity: 0, y: 80, rotateX: -38, scale: 0.92 }
      }
      whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        type: "spring",
        stiffness: 75,
        damping: 15,
        delay: (index % 3) * 0.12,
      }}
      style={{ transformOrigin: "50% 100%" }}
      className="h-full"
    >
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        whileHover={reduce ? undefined : { y: -10 }}
        style={{
          rotateX: reduce ? 0 : rx,
          rotateY: reduce ? 0 : ry,
          transformStyle: "preserve-3d",
          transformPerspective: 1100,
        }}
        className="group relative flex h-full flex-col rounded-3xl border border-border bg-card shadow-lg transition-shadow duration-500 hover:shadow-2xl hover:shadow-brand/25"
      >
        {/* image */}
        <div className="relative aspect-[4/3.1] overflow-hidden rounded-t-3xl">
          {!imgFailed ? (
            <Image
              src={service.image}
              alt={service.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgFailed(true)}
              className="object-cover transition-transform duration-900 ease-out group-hover:scale-110"
            />
          ) : (
            <div
              className="grid h-full w-full place-items-center"
              style={{
                background: `linear-gradient(150deg, ${meta.from}, ${meta.to})`,
              }}
            >
              <Icon className="h-16 w-16 text-white/80" strokeWidth={1.3} />
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/5 to-transparent" />
          <motion.div
            aria-hidden
            style={{ background: glare }}
            className="absolute inset-0 mix-blend-soft-light"
          />
        </div>

        {/* floating layers over the image (depth) */}
        <div
          className="absolute left-4 top-4"
          style={{ transform: "translateZ(55px)" }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-neutral-950/50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-lg backdrop-blur-md">
            <Icon className="h-3.5 w-3.5" />
            {service.category}
          </span>
        </div>

        {service.rating > 0 && (
          <div
            className="absolute right-4 top-4"
            style={{ transform: "translateZ(55px)" }}
          >
            <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-neutral-950/50 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
              {service.rating.toFixed(1)}
              <span className="font-normal text-white/60">
                ({service.reviewCount})
              </span>
            </span>
          </div>
        )}

        {/* body */}
        <div className="relative flex flex-1 flex-col p-5 pt-8 transform-3d">
          {/* price badge */}
          <div
            className="absolute -top-6 right-4"
            style={{ transform: "translateZ(80px)" }}
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -4, 0] }}
              transition={{
                duration: 3.5 + (index % 3) * 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="rounded-2xl bg-linear-to-br from-(--logo-from) to-(--logo-to) px-4 py-2 text-(--logo-fg) shadow-xl shadow-brand/40"
            >
              <p className="text-lg font-bold leading-none">
                ৳{money.format(service.price)}
              </p>

              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider opacity-80">
                {service.priceType}
              </p>
            </motion.div>
          </div>

          <h3 className="pr-24 font-serif text-xl font-semibold leading-snug text-foreground transform-[translateZ(30px)]">
            {service.name}
          </h3>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground transform-[translateZ(20px)]">
            <MapPin className="h-4 w-4 shrink-0 text-brand" />
            {service.location}
          </p>

          {/* vendor */}
          <div
            className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-background/60 p-3"
            style={{ transform: "translateZ(40px)" }}
          >
            <VendorAvatar
              name={service.vendor.businessName}
              image={service.vendor.image}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {service.vendor.businessName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                by {service.vendor.name}
              </p>
            </div>

            {isPremium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-1 text-[10px] font-semibold text-foreground">
                <Crown className="h-3 w-3 text-gold" /> Premium
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="mt-5 flex-1 transform-[translateZ(50px)]" />

          <div style={{ transform: "translateZ(50px)" }}>
            <Link
              href={href}
              aria-label={`View details: ${service.name}`}
              className="group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-linear-to-r from-(--logo-from) to-(--logo-to) px-5 py-3 text-sm font-semibold text-(--logo-fg) shadow-lg shadow-brand/30 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <motion.span
                aria-hidden
                className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/35"
                initial={{ left: "-40%" }}
                animate={reduce ? undefined : { left: "140%" }}
                transition={{
                  duration: 1.3,
                  repeat: Infinity,
                  repeatDelay: 2.6 + (index % 3) * 0.5,
                  ease: "easeInOut",
                }}
              />

              <span className="relative">View Details</span>
              <ArrowUpRight className="relative h-4 w-4 transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.li>
  );
}

// States
function SkeletonCard() {
  return (
    <li className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="relative aspect-[4/3.1] animate-pulse bg-muted" />

      <div className="space-y-3 p-5 pt-8">
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-muted" />
        <div className="h-16 animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 animate-pulse rounded-2xl bg-muted" />
      </div>
    </li>
  );
}

function Notice({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="col-span-full mx-auto flex max-w-md flex-col items-center rounded-3xl border border-border bg-card px-8 py-12 text-center shadow-lg">
      <motion.span
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand"
      >
        <Heart className="h-7 w-7 fill-current" />
      </motion.span>

      <h3 className="mt-4 font-serif text-xl font-semibold">{title}</h3>

      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-transform hover:scale-105 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" /> {action.label}
        </button>
      )}
    </div>
  );
}

// Section
type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; services: Service[] };

export default function FeaturedServices() {
  // const services = await getFeaturedServices(6);

  const reduce = useReducedMotion();
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();

    getFeaturedServices(COUNT, ctrl.signal)
      .then((services) => setState({ status: "ready", services }))
      .catch((e) => {
        if (e?.name !== "AbortError") setState({ status: "error" });
      });

    return () => ctrl.abort();
  }, [attempt]);

  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-28">
      {/* ambient background */}
      <motion.div
        aria-hidden
        animate={reduce ? undefined : { x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-32 top-10 -z-10 h-104 w-104 rounded-full bg-brand/10 blur-3xl"
      />

      <motion.div
        aria-hidden
        animate={reduce ? undefined : { x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-32 bottom-10 -z-10 h-112 w-md rounded-full bg-gold/15 blur-3xl"
      />

      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60 bg-[radial-gradient(color-mix(in_oklab,var(--foreground)_12%,transparent)_1px,transparent_1px)] bg-size-[30px_30px] mask-[radial-gradient(ellipse_at_50%_20%,black,transparent_70%)]"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* heading */}
        <div className="relative mx-auto max-w-2xl text-center perspective-[900px]">
          {/* floating 3D rings */}
          {!reduce && (
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-56 w-56 -translate-x-1/2 -translate-y-1/2 transform-3d"
            >
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-gold/40"
                animate={{ rotateY: 360 }}
                transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              />

              <motion.div
                className="absolute inset-3 rounded-full border-2 border-brand/35"
                animate={{ rotateX: 360 }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              />
            </div>
          )}

          <motion.span
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand shadow-sm backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" /> Handpicked for you
          </motion.span>

          <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {"Featured Wedding".split(" ").map((w, i) => (
              <motion.span
                key={w}
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
                {w}
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
                  delay: 0.25,
                }}
              >
                Services
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

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            className="mt-5 text-base text-muted-foreground sm:text-lg"
          >
            Top-rated, admin-approved services from trusted vendors, ready to
            book for your big day.
          </motion.p>
        </div>

        {/* grid */}
        <ul
          aria-busy={state.status === "loading"}
          className="mt-16 grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 perspective-[1500px]"
        >
          {state.status === "loading" &&
            Array.from({ length: COUNT }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}

          {state.status === "error" && (
            <Notice
              title="We couldn't load services"
              text="Please check your connection and try again."
              action={{
                label: "Try again",
                onClick: () => {
                  setState({ status: "loading" });
                  setAttempt((a) => a + 1);
                },
              }}
            />
          )}

          {state.status === "ready" && state.services.length === 0 && (
            <Notice
              title="No services yet"
              text="Approved services will appear here as soon as vendors publish them."
            />
          )}

          {state.status === "ready" &&
            state.services.map((s, i) => (
              <ServiceCard key={s.id} service={s} index={i} />
            ))}
        </ul>

        {/* view all */}
        {state.status === "ready" && state.services.length > 0 && (
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
                className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-brand/50 hover:bg-brand-soft"
              >
                Browse All Services
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand text-brand-foreground transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* 
<img
    src={image}
    alt={name}
    loading="lazy"
    onError={() => setFailed(true)}
    className="h-10 w-10 rounded-full object-cover ring-2 ring-brand/40"
    />
*/

/* 
<img
    src={service.image}
    alt={service.name}
    loading="lazy"
    onError={() => setImgFailed(true)}
    className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
    />
*/
