"use client";

/**
 * WedPlan - Floating Glass Mega Navbar
 *
 * Follows the assignment navbar spec:
 *  - Public:        Home, Browse Services, Sign In, Sign Up
 *  - Authenticated: Home, Browse Services, Profile dropdown
 *                   (name + image, Dashboard, Profile Settings, Logout)
 *  - Updates immediately when `user` changes (pass the live Better Auth session)
 *
 * Interactions
 *  - Floating pill that shrinks + glows on scroll, with scroll-progress line
 *  - Sliding hover pill (shared layoutId)
 *  - Browse Services mega menu with a LIVE PREVIEW panel that changes as you
 *    hover each of the six categories, plus popular cities
 *  - Animated profile dropdown (role-aware Dashboard link, Premium badge)
 *  - Cmd/Ctrl + K search palette -> /services?search=...
 *  - Light/dark theme toggle, mobile sheet with accordion
 *
 * Usage:
 *   const { data: session, isPending } = authClient.useSession();
 *   <WedPlanNavbar
 *     isPending={isPending}
 *     user={session?.user ? {
 *       name: session.user.name,
 *       image: session.user.image,
 *       role: (session.user as any).role,
 *       subscriptionPlan: (session.user as any).subscriptionPlan,
 *     } : null}
 *     onLogout={async () => { await authClient.signOut(); router.push("/"); }}
 *   />
 */

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  Building2,
  Camera,
  ChevronDown,
  Crown,
  Flower2,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  Shirt,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

// Types
export interface NavUser {
  name: string;
  image?: string | null;
  role?: "admin" | "vendor" | "customer" | string;
  subscriptionPlan?: "free" | "premium" | string;
}

interface Props {
  user: NavUser | null;
  isPending?: boolean;
  onLogout?: () => void | Promise<void>;
}

// Data
interface Category {
  name: string;
  desc: string;
  icon: LucideIcon;
  tagline: string;
  tags: string[];
  gradient: string;
}

const CATEGORIES: Category[] = [
  {
    name: "Photography & Videography",
    desc: "Capture every moment",
    icon: Camera,
    tagline: "Timeless photos and cinematic films of your big day.",
    tags: ["Pre-wedding shoot", "Cinematic film", "Drone coverage"],
    gradient: "from-rose-500/90 to-orange-400/90",
  },
  {
    name: "Wedding Venues",
    desc: "Halls, gardens & resorts",
    icon: Building2,
    tagline: "Find the perfect setting, from city halls to beach resorts.",
    tags: ["Banquet halls", "Garden venues", "Resorts"],
    gradient: "from-violet-500/90 to-rose-400/90",
  },
  {
    name: "Decoration & Florist",
    desc: "Stages, flowers & lighting",
    icon: Flower2,
    tagline: "Dreamy stages, floral arches and glowing ambience.",
    tags: ["Stage design", "Floral arches", "Mood lighting"],
    gradient: "from-pink-500/90 to-amber-300/90",
  },
  {
    name: "Catering Services",
    desc: "Menus guests will remember",
    icon: UtensilsCrossed,
    tagline: "Delicious menus crafted for every taste and guest count.",
    tags: ["Traditional menus", "Live counters", "Desserts"],
    gradient: "from-amber-500/90 to-rose-400/90",
  },
  {
    name: "Makeup & Styling",
    desc: "Bridal & groom looks",
    icon: Sparkles,
    tagline: "Radiant bridal looks and polished grooming, all day long.",
    tags: ["Bridal makeup", "Hair styling", "Groom grooming"],
    gradient: "from-fuchsia-500/90 to-pink-400/90",
  },
  {
    name: "Wedding Fashion",
    desc: "Outfits & accessories",
    icon: Shirt,
    tagline: "Sarees, lehengas, sherwanis and finishing touches.",
    tags: ["Bridal wear", "Sherwani", "Jewellery"],
    gradient: "from-red-500/90 to-yellow-400/90",
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

const QUICK_SEARCHES = [
  "Photographer",
  "Banquet hall",
  "Bridal makeup",
  "Stage decoration",
  "Catering",
];

const catHref = (c: string) => `/services?category=${encodeURIComponent(c)}`;
const cityHref = (c: string) => `/services?location=${encodeURIComponent(c)}`;

const dashboardHref = (role?: string) =>
  role === "admin"
    ? "/dashboard/admin"
    : role === "vendor"
      ? "/dashboard/vendor"
      : "/dashboard/customer";

const profileHref = (role?: string) =>
  role === "admin" ? "/dashboard/admin" : `${dashboardHref(role)}/profile`;

// Animations
const sheetList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};
const sheetItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

// Avatar
function Avatar({ user, size = 36 }: { user: NavUser; size?: number }) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return user.image ? (
    <Image
      src={user.image}
      alt={user.name}
      width={size}
      height={size}
      sizes={`${size}px`}
      className="rounded-full object-cover ring-2 ring-brand/40"
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="grid place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand ring-2 ring-brand/30"
    >
      {initials}
    </span>
  );
}

function NavPill({ active }: { active: boolean }) {
  return active ? (
    <motion.span
      layoutId="wedplan-nav-pill"
      className="absolute inset-0 -z-10 rounded-full bg-accent"
      transition={{ type: "spring", stiffness: 500, damping: 36 }}
    />
  ) : null;
}

// Search
function SearchPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  const go = (term: string) => {
    if (!term.trim()) return;
    onClose();
    router.push(`/services?search=${encodeURIComponent(term.trim())}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-70 flex items-start justify-center bg-background/60 px-4 pt-[14vh] backdrop-blur-md"
        >
          <motion.div
            role="dialog"
            aria-label="Search wedding services"
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                go(q);
              }}
              className="flex items-center gap-3 border-b border-border px-4"
            >
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search photographers, venues, decorators…"
                className="h-14 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ESC
              </kbd>
            </form>
            <div className="p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Popular searches
              </p>
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                className="flex flex-wrap gap-2"
              >
                {QUICK_SEARCHES.map((s) => (
                  <motion.button
                    key={s}
                    variants={{
                      hidden: { opacity: 0, scale: 0.85 },
                      show: { opacity: 1, scale: 1 },
                    }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => go(s)}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-brand/50 hover:bg-brand-soft hover:text-brand"
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Navbar
export default function WedPlanNavbar({
  user,
  isPending = false,
  onLogout,
}: Props) {
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [megaOpen, setMegaOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { scrollY, scrollYProgress } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 16));
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    mass: 0.3,
  });

  const openMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);

    setMegaOpen(true);
  }, []);

  const closeMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);

    closeTimer.current = setTimeout(() => setMegaOpen(false), 140);
  }, []);

  /* Close everything on route change */
  useEffect(() => {
    const timer = setTimeout(() => {
      setMegaOpen(false);
      setProfileOpen(false);
      setMobileOpen(false);
      setSearchOpen(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);

  /* Close dropdowns immediately if auth state changes */
  useEffect(() => {
    const timer = setTimeout(() => setProfileOpen(false), 0);

    return () => clearTimeout(timer);
  }, [user]);

  /* Keyboard + outside click */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }

      if (e.key === "Escape") {
        setSearchOpen(false);
        setMegaOpen(false);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };

    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    setMobileOpen(false);
    await onLogout?.();
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkBase =
    "relative z-10 flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors";
  const linkTone = (active: boolean) =>
    active ? "text-brand" : "text-foreground/80 hover:text-foreground";

  const cat = CATEGORIES[activeCat];
  const isPremium = user?.subscriptionPlan === "premium";

  return (
    <>
      <motion.header
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-6"
      >
        <motion.div
          layout
          animate={{
            maxWidth: scrolled ? 960 : 1180,
            paddingTop: scrolled ? 6 : 10,
            paddingBottom: scrolled ? 6 : 10,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className={`relative w-full rounded-2xl border border-border/70 bg-background/70 px-3 backdrop-blur-xl transition-shadow duration-300 sm:px-4 ${
            scrolled ? "shadow-lg shadow-brand/15" : "shadow-sm"
          }`}
        >
          <nav
            className="flex items-center justify-between gap-2"
            aria-label="Main navigation"
          >
            <Logo />

            {/* Desktop links */}
            <ul
              className="hidden items-center gap-0.5 lg:flex"
              onMouseLeave={() => {
                setHovered(null);
                closeMega();
              }}
            >
              <li
                onMouseEnter={() => {
                  setHovered("home");
                  closeMega();
                }}
              >
                <Link
                  href="/"
                  className={`${linkBase} ${linkTone(isActive("/"))}`}
                >
                  <NavPill active={hovered === "home"} />
                  Home
                </Link>
              </li>

              <li
                onMouseEnter={() => {
                  setHovered("services");
                  openMega();
                }}
              >
                <Link
                  href="/services"
                  aria-haspopup="true"
                  aria-expanded={megaOpen}
                  onFocus={openMega}
                  className={`${linkBase} ${linkTone(isActive("/services"))}`}
                >
                  <NavPill active={hovered === "services"} />
                  Browse Services
                  <motion.span animate={{ rotate: megaOpen ? 180 : 0 }}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </motion.span>
                </Link>
              </li>

              {!user && !isPending && (
                <li
                  onMouseEnter={() => {
                    setHovered("signin");
                    closeMega();
                  }}
                >
                  <Link
                    href="/signin"
                    className={`${linkBase} ${linkTone(isActive("/signin"))}`}
                  >
                    <NavPill active={hovered === "signin"} />
                    Sign In
                  </Link>
                </li>
              )}
            </ul>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSearchOpen(true)}
                className="hidden items-center gap-2 rounded-full border border-border bg-card/60 py-2 pl-3 pr-2 text-sm text-muted-foreground transition-colors hover:border-brand/40 xl:flex"
                aria-label="Search services"
              >
                <Search className="h-4 w-4" />

                <span className="pr-3">Search services…</span>
                <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px]">
                  ⌘K
                </kbd>
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card xl:hidden"
                aria-label="Search services"
              >
                <Search className="h-4 w-4" />
              </motion.button>

              <ThemeToggle />

              {/* Session loading skeleton (prevents navbar flicker) */}
              {isPending && (
                <div className="hidden h-9 w-24 animate-pulse rounded-full bg-muted lg:block" />
              )}

              {/* Signed-out CTA */}
              {!user && !isPending && (
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="hidden sm:block"
                >
                  <Link
                    href="/signup"
                    className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to) px-4 py-2 text-sm font-semibold text-(--logo-fg) shadow-md shadow-brand/30"
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

                    <span className="relative">Sign Up</span>
                    <ArrowRight className="relative h-4 w-4" />
                  </Link>
                </motion.div>
              )}

              {/* Profile dropdown */}
              {user && (
                <div ref={profileRef} className="relative hidden lg:block">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setProfileOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2.5 transition-colors hover:bg-accent"
                  >
                    <Avatar user={user} />

                    <span className="max-w-25 truncate text-sm font-medium">
                      {user.name}
                    </span>

                    <motion.span animate={{ rotate: profileOpen ? 180 : 0 }}>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </motion.span>
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                          opacity: 0,
                          y: -6,
                          scale: 0.97,
                          transition: { duration: 0.12 },
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 28,
                        }}
                        style={{ transformOrigin: "top right" }}
                        className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-border bg-popover p-2 shadow-2xl shadow-brand/15"
                      >
                        <div className="flex items-center gap-3 rounded-xl bg-brand-soft/70 p-3">
                          <Avatar user={user} size={44} />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {user.name}
                            </p>

                            <p className="flex items-center gap-1 text-xs capitalize text-brand">
                              {user.role}
                              {isPremium && (
                                <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-gold/25 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                                  <Crown className="h-3 w-3 text-gold" />{" "}
                                  Premium
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 space-y-0.5">
                          {[
                            {
                              href: dashboardHref(user.role),
                              label: "Dashboard",
                              icon: LayoutDashboard,
                            },
                            {
                              href: profileHref(user.role),
                              label: "Profile Settings",
                              icon: Settings,
                            },
                          ].map(({ href, label, icon: Icon }, i) => (
                            <motion.div
                              key={label}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 * (i + 1) }}
                            >
                              <Link
                                href={href}
                                role="menuitem"
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-brand"
                              >
                                <Icon className="h-4 w-4" />
                                {label}
                              </Link>
                            </motion.div>
                          ))}

                          <motion.button
                            role="menuitem"
                            onClick={handleLogout}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card lg:hidden"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={mobileOpen ? "x" : "m"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                  >
                    {mobileOpen ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Menu className="h-4 w-4" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          </nav>

          {/* Scroll progress */}
          <motion.div
            style={{ scaleX: progress }}
            className="absolute inset-x-4 bottom-0 h-0.5 origin-left rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to)"
          />

          {/* ===== MEGA MENU PANEL =====*/}
          <AnimatePresence>
            {megaOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: -8,
                  scale: 0.98,
                  transition: { duration: 0.12 },
                }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                onMouseEnter={openMega}
                onMouseLeave={closeMega}
                className="absolute left-1/2 top-full hidden w-195 max-w-[calc(100vw-3rem)] -translate-x-1/2 pt-3 lg:block"
              >
                <div className="overflow-hidden rounded-2xl border border-border bg-popover/95 p-3 shadow-2xl shadow-brand/15 backdrop-blur-xl">
                  <div className="grid grid-cols-5 gap-3">
                    {/* Category list */}
                    <ul
                      className="col-span-3 grid grid-cols-1 gap-0.5"
                      onMouseLeave={() => undefined}
                    >
                      {CATEGORIES.map((c, i) => (
                        <motion.li
                          key={c.name}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.035 * i + 0.04 }}
                          onMouseEnter={() => setActiveCat(i)}
                        >
                          <Link
                            href={catHref(c.name)}
                            className="group relative flex items-center gap-3 rounded-xl p-2.5"
                          >
                            {activeCat === i && (
                              <motion.span
                                layoutId="wedplan-cat-highlight"
                                className="absolute inset-0 rounded-xl bg-accent ring-1 ring-brand/20"
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 38,
                                }}
                              />
                            )}

                            <motion.span
                              animate={
                                activeCat === i
                                  ? { rotate: -8, scale: 1.1 }
                                  : { rotate: 0, scale: 1 }
                              }
                              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"
                            >
                              <c.icon className="h-5 w-5" />
                            </motion.span>

                            <span className="relative min-w-0 flex-1">
                              <span className="block text-sm font-semibold">
                                {c.name}
                              </span>

                              <span className="block text-xs text-muted-foreground">
                                {c.desc}
                              </span>
                            </span>

                            <ArrowRight
                              className={`relative h-4 w-4 text-brand transition-all ${
                                activeCat === i
                                  ? "translate-x-0 opacity-100"
                                  : "-translate-x-2 opacity-0"
                              }`}
                            />
                          </Link>
                        </motion.li>
                      ))}
                    </ul>

                    {/* Live preview card */}
                    <div className="col-span-2">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={cat.name}
                          initial={{ opacity: 0, x: 24, scale: 0.97 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{
                            opacity: 0,
                            x: -24,
                            scale: 0.97,
                            transition: { duration: 0.12 },
                          }}
                          transition={{ duration: 0.22 }}
                          className={`relative flex h-full min-h-70 flex-col justify-between overflow-hidden rounded-xl bg-linear-to-br ${cat.gradient} p-4 text-white`}
                        >
                          <motion.div
                            aria-hidden
                            animate={{
                              scale: [1, 1.25, 1],
                              opacity: [0.2, 0.4, 0.2],
                            }}
                            transition={{ duration: 6, repeat: Infinity }}
                            className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/50 blur-2xl"
                          />

                          <cat.icon className="absolute -bottom-4 -right-4 h-28 w-28 rotate-12 text-white/15" />

                          <div className="relative">
                            <span className="rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                              Featured category
                            </span>

                            <h3 className="mt-3 font-serif text-xl font-semibold leading-snug">
                              {cat.name}
                            </h3>

                            <p className="mt-1 text-xs leading-relaxed text-white/90">
                              {cat.tagline}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {cat.tags.map((t, i) => (
                                <motion.span
                                  key={t}
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.08 * i + 0.1 }}
                                  className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] backdrop-blur-sm"
                                >
                                  {t}
                                </motion.span>
                              ))}
                            </div>
                          </div>

                          <Link
                            href={catHref(cat.name)}
                            className="relative mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-900 transition-transform hover:scale-105"
                          >
                            Explore {cat.name.split(" ")[0]}{" "}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Cities strip */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Popular cities
                    </span>

                    {CITIES.map((c, i) => (
                      <motion.div
                        key={c}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + 0.04 * i }}
                        whileHover={{ y: -2 }}
                      >
                        <Link
                          href={cityHref(c)}
                          className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs transition-colors hover:border-brand/50 hover:bg-brand-soft hover:text-brand"
                        >
                          <MapPin className="h-3 w-3" />
                          {c}
                        </Link>
                      </motion.div>
                    ))}

                    <Link
                      href="/services"
                      className="ml-auto flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                    >
                      View all services <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.header>

      {/* Soft dim behind mega menu */}
      <AnimatePresence>
        {megaOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-40 hidden bg-background/30 backdrop-blur-[2px] lg:block"
          />
        )}
      </AnimatePresence>

      {/* ===== MOBILE SHEET =====*/}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="ov"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-55 bg-background/60 backdrop-blur-sm lg:hidden"
            />

            <motion.div
              key="sheet"
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="fixed inset-x-3 top-19 z-60 max-h-[calc(100vh-96px)] overflow-y-auto rounded-2xl border border-border bg-popover p-3 shadow-2xl lg:hidden"
            >
              <motion.ul
                variants={sheetList}
                initial="hidden"
                animate="show"
                className="space-y-1"
              >
                {user && (
                  <motion.li
                    variants={sheetItem}
                    className="mb-2 flex items-center gap-3 rounded-2xl bg-brand-soft p-3"
                  >
                    <Avatar user={user} size={44} />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {user.name}
                      </p>
                      <p className="text-xs capitalize text-brand">
                        {user.role}
                        {isPremium ? " · Premium" : ""}
                      </p>
                    </div>
                  </motion.li>
                )}

                <motion.li variants={sheetItem}>
                  <Link
                    href="/"
                    className="block rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent"
                  >
                    Home
                  </Link>
                </motion.li>

                <motion.li variants={sheetItem}>
                  <button
                    onClick={() => setMobileServicesOpen((v) => !v)}
                    aria-expanded={mobileServicesOpen}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent"
                  >
                    Browse Services
                    <motion.span
                      animate={{ rotate: mobileServicesOpen ? 180 : 0 }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {mobileServicesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 pb-2 pl-2">
                          <Link
                            href="/services"
                            className="block rounded-lg px-3 py-2 text-sm font-semibold text-brand"
                          >
                            All services
                          </Link>

                          {CATEGORIES.map((c) => (
                            <Link
                              key={c.name}
                              href={catHref(c.name)}
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                              <c.icon className="h-4 w-4 text-brand" />
                              {c.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>

                {user ? (
                  <>
                    <motion.li variants={sheetItem}>
                      <Link
                        href={dashboardHref(user.role)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent"
                      >
                        <LayoutDashboard className="h-4 w-4 text-brand" />{" "}
                        Dashboard
                      </Link>
                    </motion.li>

                    <motion.li variants={sheetItem}>
                      <Link
                        href={profileHref(user.role)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-accent"
                      >
                        <Settings className="h-4 w-4 text-brand" /> Profile
                        Settings
                      </Link>
                    </motion.li>

                    <motion.li variants={sheetItem}>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </motion.li>
                  </>
                ) : (
                  <motion.li
                    variants={sheetItem}
                    className="grid grid-cols-2 gap-2 pt-2"
                  >
                    <Link
                      href="/signin"
                      className="rounded-xl border border-border py-2.5 text-center text-sm font-medium"
                    >
                      Sign In
                    </Link>

                    <Link
                      href="/signup"
                      className="rounded-xl bg-linear-to-r from-(--logo-from) to-(--logo-to) py-2.5 text-center text-sm font-semibold text-(--logo-fg)"
                    >
                      Sign Up
                    </Link>
                  </motion.li>
                )}
              </motion.ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {searchOpen && (
        <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}

/* 
<img
  src={user.image}
  alt={user.name}
  style={{ width: size, height: size }}
  className="rounded-full object-cover ring-2 ring-brand/40"
/> 
*/
