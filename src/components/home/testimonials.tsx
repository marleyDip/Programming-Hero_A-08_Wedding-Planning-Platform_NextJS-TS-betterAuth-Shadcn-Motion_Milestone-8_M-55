"use client";

/**
 * WedPlan - Customer Testimonials
 * Place at: components/home/testimonials.tsx   (needs section-kit.tsx + lib/services-api.ts)
 *
 * A 3D stacked deck of review cards: the front card can be dragged/swiped away, the ones
 * behind sit in depth. Also: avatar selector, arrows, autoplay (pauses on hover), keyboard
 * arrows, animated stars.
 *
 * IMPORTANT - sample content: the built-in reviews (and the `testimonials` collection in db.json)
 * are PLACEHOLDERS marked `sample: true`. While any sample review is shown, the section displays a
 * "Sample reviews" tag so nothing is passed off as real. Replace them with real customer reviews
 * (set `sample` to false / remove it) and the tag disappears. The average rating is calculated
 * from the reviews shown; nothing is invented.
 */

import { getTestimonials, type Testimonial } from "@/lib/services-api";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { SectionBackdrop, SectionHeading } from "./section-kit";

const AV = (n: number) => `https://i.pravatar.cc/160?img=${n}`;

/** Shown instantly and as the fallback when the API is unreachable. All PLACEHOLDERS. */
const DEFAULTS: Testimonial[] = [
  {
    id: "t-1",
    name: "Ayesha & Rahim",
    location: "Dhaka",
    service: "Wedding Photography",
    rating: 5,
    quote:
      "Everything was in one place, so comparing vendors was easy. Sending a booking request only took a few minutes.",
    image: AV(44),
    sample: true,
  },
  {
    id: "t-2",
    name: "Tasnia & Farhan",
    location: "Chattogram",
    service: "Wedding Venues",
    rating: 5,
    quote:
      "We could filter by city, check prices upfront and see exactly who the vendor was before booking.",
    image: AV(5),
    sample: true,
  },
  {
    id: "t-3",
    name: "Mitu & Sabbir",
    location: "Sylhet",
    service: "Decoration & Florist",
    rating: 4,
    quote:
      "The dashboard made it simple to follow our requests from pending to confirmed without chasing anyone.",
    image: AV(26),
    sample: true,
  },
  {
    id: "t-4",
    name: "Nabila & Arif",
    location: "Dhaka",
    service: "Makeup & Styling",
    rating: 5,
    quote:
      "Finding bridal makeup and styling in the same app as our venue and decor saved us so much time.",
    image: AV(23),
    sample: true,
  },
  {
    id: "t-5",
    name: "Shirin & Kamal",
    location: "Rajshahi",
    service: "Catering Services",
    rating: 5,
    quote:
      "Clear descriptions and honest pricing helped us choose a caterer with confidence.",
    image: AV(52),
    sample: true,
  },
];

const AUTOPLAY_MS = 7000;

function Stars({
  value,
  size = "h-4 w-4",
  animateIn = false,
}: {
  value: number;
  size?: string;
  animateIn?: boolean;
}) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          initial={animateIn ? { scale: 0, rotate: -40 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.25 + i * 0.07,
            type: "spring",
            stiffness: 300,
            damping: 14,
          }}
        >
          <Star
            className={`${size} ${i < Math.round(value) ? "fill-gold text-gold" : "text-border"}`}
          />
        </motion.span>
      ))}
    </div>
  );
}

function Avatar({ t, size = 48 }: { t: Testimonial; size?: number }) {
  const [failed, setFailed] = useState(false);

  const initials = t.name
    .split(/[ &]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return t.image && !failed ? (
    <Image
      src={t.image}
      alt=""
      width={size}
      height={size}
      sizes={`${size}px`}
      onError={() => setFailed(true)}
      className="rounded-full object-cover"
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="grid place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand"
    >
      {initials}
    </span>
  );
}

/** Pose of a card by its distance from the front of the deck. */
const POSE = [
  { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
  { x: 20, y: 26, scale: 0.94, rotate: 2.5, opacity: 1 },
  { x: 38, y: 52, scale: 0.88, rotate: 5, opacity: 1 },
];

const HIDDEN = { x: 46, y: 66, scale: 0.82, rotate: 7, opacity: 0 };

function DeckCard({
  t,
  rel,
  onNext,
  onPrev,
}: {
  t: Testimonial;
  rel: number;
  onNext: () => void;
  onPrev: () => void;
}) {
  const reduce = useReducedMotion();
  const front = rel === 0;
  const pose = rel < POSE.length ? POSE[rel] : HIDDEN;
  const dragX = useMotionValue(0);

  return (
    <motion.article
      aria-hidden={!front}
      drag={front ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.5}
      style={{
        x: front ? dragX : undefined,
        zIndex: 10 - rel,
        transformPerspective: 1200,
      }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -90) onNext();
        else if (info.offset.x > 90) onPrev();
        else animate(dragX, 0, { type: "spring", stiffness: 300, damping: 24 });
      }}
      initial={false}
      animate={{ ...pose, rotateX: front ? 0 : -4 }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 140, damping: 20 }
      }
      whileDrag={{ scale: 1.02, cursor: "grabbing" }}
      className="absolute inset-0 flex cursor-grab touch-pan-y select-none flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-brand/10 sm:p-8"
    >
      <Quote
        aria-hidden
        className="absolute right-6 top-6 h-14 w-14 text-brand/10"
        strokeWidth={1.2}
      />

      <div>
        <Stars value={t.rating} animateIn={front} />
        <blockquote className="mt-5 font-serif text-lg leading-relaxed text-foreground sm:text-xl">
          “{t.quote}”
        </blockquote>
      </div>

      <footer className="mt-6 flex items-center gap-3">
        <span className="rounded-full p-0.5 ring-2 ring-brand/40">
          <Avatar t={t} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {t.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[t.service, t.location].filter(Boolean).join(" · ")}
          </p>
        </div>
      </footer>
    </motion.article>
  );
}

export default function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>(DEFAULTS);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const N = items.length;

  useEffect(() => {
    const ctrl = new AbortController();

    getTestimonials(ctrl.signal)
      .then((rows) => {
        if (rows.length) {
          setItems(rows);
          setActive(0);
        }
      })
      .catch(() => undefined); // keep the defaults

    return () => ctrl.abort();
  }, []);

  const go = useCallback((to: number) => setActive(((to % N) + N) % N), [N]);

  useEffect(() => {
    if (paused || reduce || N < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % N), AUTOPLAY_MS);

    return () => clearInterval(t);
  }, [paused, reduce, N, active]);

  const average = items.reduce((sum, t) => sum + t.rating, 0) / Math.max(N, 1);
  const hasSample = items.some((t) => t.sample);

  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-28">
      <SectionBackdrop />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* left */}
        <div>
          <SectionHeading
            align="left"
            eyebrow="Love notes"
            words={["Customer"]}
            accent="Testimonials"
            subtitle="Hear from couples who planned their big day with WedPlan."
          />

          {/* summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center gap-5"
          >
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/80 px-5 py-4 shadow-sm backdrop-blur">
              <span className="font-serif text-4xl font-semibold">
                {average.toFixed(1)}
              </span>

              <div>
                <Stars value={average} />
                <p className="mt-1 text-xs text-muted-foreground">
                  from {N} {N === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>

            {hasSample && (
              <span
                title="These are placeholder reviews. Replace them with real customer reviews."
                className="rounded-full border border-dashed border-gold/60 bg-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground"
              >
                Sample reviews
              </span>
            )}
          </motion.div>

          {/* avatar selector */}
          <div
            role="tablist"
            aria-label="Choose a testimonial"
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            {items.map((t, i) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={i === active}
                aria-label={`Show review by ${t.name}`}
                onClick={() => go(i)}
                className="relative rounded-full p-1 outline-none transition-transform hover:scale-110 focus-visible:ring-4 focus-visible:ring-brand/40"
              >
                {i === active && (
                  <motion.span
                    layoutId="testimonial-ring"
                    className="absolute inset-0 rounded-full bg-linear-to-br from-(--logo-from) to-(--logo-to)"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}

                <span
                  className={`relative block rounded-full p-0.5 transition-opacity ${i === active ? "bg-background" : "opacity-60"}`}
                >
                  <Avatar t={t} size={44} />
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3">
            {[
              { dir: -1, icon: ArrowLeft, label: "Previous review" },
              { dir: 1, icon: ArrowRight, label: "Next review" },
            ].map(({ dir, icon: Icon, label }) => (
              <motion.button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => go(active + dir)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="grid h-12 w-12 place-items-center rounded-full border border-border bg-card shadow-sm transition-colors hover:border-transparent hover:bg-brand hover:text-brand-foreground"
              >
                <Icon className="h-5 w-5" />
              </motion.button>
            ))}

            <span
              className="ml-2 font-mono text-xs text-muted-foreground"
              aria-live="polite"
            >
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(N).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* deck */}
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Customer testimonials"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(active + 1);
            if (e.key === "ArrowLeft") go(active - 1);
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className="relative mx-auto w-full max-w-xl rounded-3xl pb-16 pr-10 outline-none perspective-[1500px] focus-visible:ring-4 focus-visible:ring-brand/30"
        >
          <div className="relative h-96 sm:h-88">
            {items.map((t, i) => (
              <DeckCard
                key={t.id}
                t={t}
                rel={(i - active + N) % N}
                onNext={() => go(active + 1)}
                onPrev={() => go(active - 1)}
              />
            ))}
          </div>

          <p className="mt-20 text-center text-xs text-muted-foreground sm:hidden">
            Swipe the card to see more
          </p>
        </div>
      </div>
    </section>
  );
}
