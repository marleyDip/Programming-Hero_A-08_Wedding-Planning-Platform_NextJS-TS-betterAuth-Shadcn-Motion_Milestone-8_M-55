"use client";

/**
 * WedPlan - Premium animated footer
 * Place at: components/footer.tsx   (imports ./logo, same folder as navbar.tsx)
 *
 * Covers the assignment footer spec:
 *   Logo + short description, navigation links, contact info, social links, copyright.
 * Plus: animated CTA, "Developer" showcase card, giant animated wordmark,
 * and a copyright bar with an animated name.
 *
 * Framer Motion techniques used: useMotionValue / useSpring / useTransform
 * (3D tilt), useMotionTemplate (cursor spotlight), magnetic buttons, rotating
 * conic-gradient border, infinite marquee, whileInView stagger, scroll-linked
 * progress ring (useScroll), AnimatePresence role rotator, per-letter wave.
 *
 * Usage:  <Footer isAuthenticated={!!session?.user} />   (in app/layout.tsx after {children})
 *
 * >>> Edit the CONFIG block below (developer details, contact, social URLs). <<<
 */

import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Globe,
  Heart,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "./logo";

// CONFIG - edit these
const DEVELOPER = {
  name: "Md Sofian Hasan",
  roles: ["Full-Stack Developer", "UI Engineer", "Problem Solver"],
  bio: "I build fast, accessible and beautiful web products with the MERN & PERN stack, from pixel-perfect interfaces to secure, scalable APIs.",
  image: "/me.jpeg", // optional: "/me.jpg" or an ImgBB URL. Leave empty to show initials.
  available: true,
  links: {
    github: "https://github.com/marleyDip",
    linkedin: "https://linkedin.com/in/sofian-hasan/",
    portfolio: "https://marleydip.netlify.app/",
    email: "mailto:dip.akand9899@gmail.com",
  },
  stack: [
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "ShadCN UI",
    "Framer Motion",
    "Express.js",
    "MongoDB",
    "Better Auth",
    "Stripe",
    "Sonner",
  ],
};

const CONTACT = {
  address: "Dhaka, Bangladesh",
  phone: "+880 1XXX-XXXXXX",
  email: "hello@wedplan.com",
};

const SOCIALS = [
  { label: "Facebook", href: "https://facebook.com", icon: "facebook" },
  { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
  { label: "Twitter / X", href: "https://x.com", icon: "twitter" },
  { label: "YouTube", href: "https://youtube.com", icon: "youtube" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
] as const;

const CATEGORIES = [
  "Photography & Videography",
  "Wedding Venues",
  "Decoration & Florist",
  "Catering Services",
  "Makeup & Styling",
  "Wedding Fashion",
];

// Brand icons (inline so there is no dependency on lucide brand icons)
function BrandIcon({
  name,
  className = "h-4 w-4",
}: {
  name: string;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "facebook":
      return (
        <svg {...common}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );

    case "instagram":
      return (
        <svg {...common}>
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );

    case "twitter":
      return (
        <svg {...common}>
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
      );

    case "youtube":
      return (
        <svg {...common}>
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
          <path d="m10 15 5-3-5-3z" />
        </svg>
      );

    case "linkedin":
      return (
        <svg {...common}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );

    case "github":
      return (
        <svg {...common}>
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
      );

    default:
      return null;
  }
}

// Small reusable pieces
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 22 },

  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 18 },
  },
};

/** Wraps children so they are gently pulled toward the cursor. */
function Magnetic({
  children,
  strength = 0.35,
}: {
  children: ReactNode;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useSpring(useMotionValue(0), {
    stiffness: 220,
    damping: 15,
    mass: 0.2,
  });

  const y = useSpring(useMotionValue(0), {
    stiffness: 220,
    damping: 15,
    mass: 0.2,
  });

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

function SocialButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Magnetic>
      <motion.a
        href={href}
        target={href.startsWith("mailto:") ? undefined : "_blank"}
        rel="noopener noreferrer"
        aria-label={label}
        title={label}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        className="group relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-border bg-card/70 text-muted-foreground backdrop-blur transition-colors hover:border-transparent hover:text-(--logo-fg)"
      >
        <span className="absolute inset-0 translate-y-full bg-linear-to-br from-(--logo-from) to-(--logo-to) transition-transform duration-300 group-hover:translate-y-0" />

        <span className="relative">{icon}</span>
      </motion.a>
    </Magnetic>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="relative">
        {children}
        <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100" />
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 -translate-x-1 text-brand opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
    </Link>
  );
}

function ColumnTitle({ children }: { children: ReactNode }) {
  return (
    <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
      <span className="h-px w-5 bg-linear-to-r from-(--logo-from) to-(--logo-to)" />
      {children}
    </h4>
  );
}

/** Per-letter name that periodically waves. Gradient text. */
function AnimatedName({ text }: { text: string }) {
  return (
    <span
      aria-label={text}
      className="inline-flex bg-linear-to-r from-(--logo-from) to-(--logo-to) bg-clip-text font-semibold text-transparent"
    >
      {text.split("").map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block"
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 0.7,
            delay: i * 0.07,
            repeat: Infinity,
            repeatDelay: 4.5,
            ease: "easeInOut",
          }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </span>
  );
}

// CTA banner
function CtaBanner({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: "spring", stiffness: 110, damping: 18 }}
      className="relative overflow-hidden rounded-3xl bg-linear-to-br from-(--logo-from) to-(--logo-to) px-6 py-12 text-(--logo-fg) shadow-2xl shadow-brand/25 sm:px-12"
    >
      <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />

      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[3px] border-current opacity-15"
      />

      <motion.div
        aria-hidden
        animate={{ rotate: -360 }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        className="absolute -right-4 -top-4 h-80 w-80 rounded-full border-[3px] border-current opacity-15"
      />

      <motion.div
        aria-hidden
        animate={{ y: [0, -14, 0], rotate: [-8, 8, -8] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 right-[18%] hidden opacity-30 md:block"
      >
        <Heart className="h-10 w-10 fill-current" />
      </motion.div>

      <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Your big day starts here
          </span>

          <h3 className="mt-4 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            Ready to plan your dream wedding?
          </h3>

          <p className="mt-2 text-sm opacity-90">
            Discover trusted vendors, compare services and send booking requests
            in minutes.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Magnetic strength={0.25}>
            <Link
              href="/services"
              className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-lg"
            >
              <motion.span
                aria-hidden
                className="absolute inset-y-0 w-1/3 -skew-x-12 bg-neutral-900/10"
                initial={{ left: "-40%" }}
                animate={{ left: "140%" }}
                transition={{
                  duration: 1.3,
                  repeat: Infinity,
                  repeatDelay: 2.5,
                  ease: "easeInOut",
                }}
              />
              <span className="relative">Explore Services</span>
              <ArrowRight className="relative h-4 w-4" />
            </Link>
          </Magnetic>

          {!isAuthenticated && (
            <Magnetic strength={0.25}>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full border border-current/40 bg-black/10 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:bg-black/20"
              >
                Create account
              </Link>
            </Magnetic>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Developer card
function RoleRotator() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setI((v) => (v + 1) % DEVELOPER.roles.length),
      2600,
    );

    return () => clearInterval(t);
  }, []);

  return (
    <span className="relative inline-flex h-6 overflow-hidden align-middle">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={i}
          initial={{ y: 22, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -22, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-medium text-brand"
        >
          {DEVELOPER.roles[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function TechMarquee() {
  const reduce = useReducedMotion();
  const list = [...DEVELOPER.stack, ...DEVELOPER.stack];
  return (
    <div className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex w-max gap-2.5 py-1"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {list.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-2 rounded-full border border-border bg-background/60 px-3.5 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-linear-to-br from-(--logo-from) to-(--logo-to)" />
            {t}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function DeveloperCard() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(useTransform(py, [0, 1], [6, -6]), {
    stiffness: 160,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(px, [0, 1], [-6, 6]), {
    stiffness: 160,
    damping: 18,
  });

  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, color-mix(in oklab, var(--brand) 18%, transparent), transparent 65%)`;

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    mx.set(x);
    my.set(y);
    px.set(x / r.width);
    py.set(y / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  const initials = DEVELOPER.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mt-20">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-5 flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground"
      >
        <span className="h-px w-10 bg-border" />
        Meet the developer
        <span className="h-px w-10 bg-border" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ type: "spring", stiffness: 100, damping: 18 }}
        style={{ perspective: 1200 }}
      >
        <motion.div
          ref={ref}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          style={{
            rotateX: reduce ? 0 : rotateX,
            rotateY: reduce ? 0 : rotateY,
            transformStyle: "preserve-3d",
          }}
          className="group relative overflow-hidden rounded-3xl p-[1.5px]"
        >
          {/* rotating conic gradient border */}
          <motion.div
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-60%] bg-[conic-gradient(from_0deg,transparent_0_62%,var(--brand)_80%,var(--gold)_92%,transparent_100%)]"
          />

          <div className="relative overflow-hidden rounded-[calc(1.5rem-1.5px)] bg-card/95 p-6 backdrop-blur-xl sm:p-8">
            {/* cursor spotlight */}
            <motion.div
              aria-hidden
              style={{ background: spotlight }}
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />

            {/* dot grid */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(color-mix(in_oklab,var(--foreground)_12%,transparent)_1px,transparent_1px)] bg-size-[20px_20px] mask-[radial-gradient(ellipse_at_top_right,black,transparent_65%)]"
            />

            <div className="relative flex flex-col items-center gap-8 text-center md:flex-row md:items-center md:text-left">
              {/* Avatar */}
              <div
                className="relative h-28 w-28 shrink-0"
                style={{ transform: "translateZ(40px)" }}
              >
                <motion.span
                  aria-hidden
                  className="absolute -inset-2.5 rounded-full border-2 border-dashed border-brand/50"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                <motion.span
                  aria-hidden
                  className="absolute -inset-5 rounded-full border border-gold/40"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.15, 0.7] }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <div className="relative grid h-full w-full place-items-center overflow-hidden rounded-full bg-linear-to-br from-(--logo-from) to-(--logo-to) text-3xl font-bold text-(--logo-fg) shadow-xl shadow-brand/30">
                  {DEVELOPER.image ? (
                    <Image
                      src={DEVELOPER.image}
                      alt={DEVELOPER.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                {DEVELOPER.available && (
                  <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-card">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
                    </span>
                  </span>
                )}
              </div>

              {/* Info */}
              <div
                className="min-w-0 flex-1"
                style={{ transform: "translateZ(24px)" }}
              >
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 md:justify-start">
                  <motion.h3
                    className="bg-[linear-gradient(110deg,var(--foreground)_35%,var(--brand)_50%,var(--foreground)_65%)] bg-size-[250%_100%] bg-clip-text font-serif text-3xl font-semibold text-transparent sm:text-4xl"
                    animate={{ backgroundPosition: ["200% 0", "-50% 0"] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    {DEVELOPER.name}
                  </motion.h3>

                  {DEVELOPER.available && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
                      Open to work
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center justify-center gap-2 md:justify-start">
                  <span className="text-sm text-muted-foreground">
                    I&apos;m a
                  </span>
                  <RoleRotator />
                </div>

                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {DEVELOPER.bio}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 md:justify-start">
                  <SocialButton
                    href={DEVELOPER.links.github}
                    label="GitHub"
                    icon={<BrandIcon name="github" />}
                  />

                  <SocialButton
                    href={DEVELOPER.links.linkedin}
                    label="LinkedIn"
                    icon={<BrandIcon name="linkedin" />}
                  />

                  <SocialButton
                    href={DEVELOPER.links.portfolio}
                    label="Portfolio"
                    icon={<Globe className="h-4 w-4" />}
                  />

                  <SocialButton
                    href={DEVELOPER.links.email}
                    label="Email"
                    icon={<Mail className="h-4 w-4" />}
                  />

                  <Magnetic strength={0.2}>
                    <a
                      href={DEVELOPER.links.email}
                      className="relative ml-1 inline-flex items-center gap-2 overflow-hidden rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to) px-5 py-2.5 text-sm font-semibold text-(--logo-fg) shadow-lg shadow-brand/30"
                    >
                      <motion.span
                        aria-hidden
                        className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/35"
                        initial={{ left: "-40%" }}
                        animate={{ left: "140%" }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          repeatDelay: 2.8,
                          ease: "easeInOut",
                        }}
                      />
                      <span className="relative">Let&apos;s talk</span>
                      <ArrowRight className="relative h-4 w-4" />
                    </a>
                  </Magnetic>
                </div>
              </div>
            </div>

            <div className="relative mt-8 border-t border-border pt-5">
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground md:text-left">
                Built with
              </p>
              <TechMarquee />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Giant animated wordmark
function GiantWordmark() {
  const letters = "WedPlan".split("");

  return (
    <div
      aria-hidden
      className="mt-16 select-none overflow-hidden text-center font-serif font-bold leading-[0.9] tracking-tighter text-[clamp(4rem,19vw,17rem)] mask-[linear-gradient(to_bottom,black_30%,transparent_98%)]"
    >
      <motion.span
        className="inline-flex"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {letters.map((l, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.06em]">
            <motion.span
              variants={{
                hidden: { y: "105%", rotate: 8 },
                show: {
                  y: "0%",
                  rotate: 0,
                  transition: { type: "spring", stiffness: 110, damping: 15 },
                },
              }}
              className={`inline-block cursor-default transition-colors duration-300 [-webkit-text-stroke:2px] ${
                i < 3
                  ? "text-transparent [-webkit-text-stroke-color:color-mix(in_oklab,var(--foreground)_22%,transparent)] hover:text-foreground/10"
                  : "text-brand/15 [-webkit-text-stroke-color:color-mix(in_oklab,var(--brand)_70%,transparent)] hover:text-brand/40"
              }`}
            >
              {l}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </div>
  );
}

// Back to top (scroll-progress ring)
function BackToTop() {
  const { scrollYProgress, scrollY } = useScroll();
  const [show, setShow] = useState(false);

  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    mass: 0.3,
  });

  useEffect(() => scrollY.on("change", (v) => setShow(v > 500)), [scrollY]);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-border bg-card/90 text-foreground shadow-xl backdrop-blur sm:left-6"
        >
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 48 48"
            aria-hidden
          >
            <circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              strokeWidth="3"
              className="stroke-border"
            />

            <motion.circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className="stroke-brand"
              style={{ pathLength: progress }}
            />
          </svg>
          <ArrowUp className="relative h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// Footer
export default function Footer({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean;
}) {
  const year = new Date().getFullYear();

  // const [year, setYear] = useState<number | null>(null);

  // useEffect(() => {
  //   setYear(new Date().getFullYear());
  // }, []);

  const explore = [
    { label: "Home", href: "/" },
    { label: "Browse Services", href: "/services" },
    ...(isAuthenticated
      ? []
      : [
          { label: "Sign In", href: "/signin" },
          { label: "Sign Up", href: "/signup" },
        ]),
  ];

  return (
    <footer className="relative mt-28 overflow-hidden border-t border-border bg-background">
      {/* Ambient background */}
      <motion.div
        aria-hidden
        animate={{ x: [0, 60, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-brand/10 blur-3xl"
      />

      <motion.div
        aria-hidden
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -right-32 bottom-40 h-96 w-96 rounded-full bg-gold/15 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-16 sm:px-6 lg:px-8">
        <div className="-mt-32 mb-16 sm:-mt-36">
          <CtaBanner isAuthenticated={isAuthenticated} />
        </div>

        {/* Main columns */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12"
        >
          {/* Brand */}
          <motion.div variants={item} className="lg:col-span-4">
            <Logo />

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              WedPlan connects couples with trusted wedding vendors, from
              photographers and venues to decorators and caterers, so planning
              your big day feels effortless.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {SOCIALS.map((s) => (
                <SocialButton
                  key={s.label}
                  href={s.href}
                  label={s.label}
                  icon={<BrandIcon name={s.icon} />}
                />
              ))}
            </div>
          </motion.div>

          {/* Explore */}
          <motion.div variants={item} className="lg:col-span-2">
            <ColumnTitle>Explore</ColumnTitle>
            <ul className="space-y-3">
              {explore.map((l) => (
                <li key={l.label}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Categories */}
          <motion.div variants={item} className="lg:col-span-3">
            <ColumnTitle>Categories</ColumnTitle>
            <ul className="space-y-3">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <FooterLink
                    href={`/services?category=${encodeURIComponent(c)}`}
                  >
                    {c}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={item} className="lg:col-span-3">
            <ColumnTitle>Contact</ColumnTitle>
            <ul className="space-y-4 text-sm">
              {[
                { icon: MapPin, text: CONTACT.address, href: undefined },
                {
                  icon: Phone,
                  text: CONTACT.phone,
                  href: `tel:${CONTACT.phone.replace(/[^+\d]/g, "")}`,
                },
                {
                  icon: Mail,
                  text: CONTACT.email,
                  href: `mailto:${CONTACT.email}`,
                },
              ].map(({ icon: Icon, text, href }) => {
                const inner = (
                  <>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-muted-foreground transition-colors group-hover:text-foreground">
                      {text}
                    </span>
                  </>
                );

                return (
                  <li key={text}>
                    {href ? (
                      <a href={href} className="group flex items-center gap-3">
                        {inner}
                      </a>
                    ) : (
                      <div className="group flex items-center gap-3">
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>

        {/* Developer */}
        <DeveloperCard />

        {/* Giant wordmark */}
        <GiantWordmark />

        {/* Copyright bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-center text-sm text-muted-foreground sm:flex-row sm:text-left"
        >
          <p className="flex flex-wrap items-center justify-center gap-x-1.5 sm:justify-start">
            © {year} <AnimatedName text="WedPlan" />. All rights reserved.
          </p>

          <p className="flex flex-wrap items-center justify-center gap-x-1.5 sm:justify-end">
            Designed &amp; built with
            <motion.span
              aria-label="love"
              animate={{ scale: [1, 1.3, 1, 1.2, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }}
              className="inline-block"
            >
              <Heart className="h-4 w-4 fill-brand text-brand" />
            </motion.span>
            by <AnimatedName text={DEVELOPER.name} />
          </p>
        </motion.div>
      </div>

      <BackToTop />
    </footer>
  );
}
