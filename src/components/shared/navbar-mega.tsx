"use client";

/**
 * WedPlan - Animated Mega Navbar
 * Stack: Next.js (App Router) + TypeScript + Tailwind/ShadCN + Framer Motion + lucide-react
 *
 * Features
 *  - Scroll-aware header (shrinks, blurs, gets shadow) + scroll progress bar
 *  - "Browse Services" mega menu (hover-intent + keyboard + Escape support)
 *  - Shared-layout sliding pill highlight on top-level links
 *  - Staggered category cards with animated hover highlight
 *  - Animated profile dropdown (Dashboard / Profile Settings / Logout)
 *  - Mobile drawer with animated hamburger, accordion and staggered links
 *
 * Usage (e.g. app/layout.tsx):
 *   const { data: session } = authClient.useSession();   // Better Auth
 *   <MegaNavbar
 *     user={session?.user ? {
 *       name: session.user.name,
 *       image: session.user.image,
 *       role: (session.user as any).role,
 *     } : null}
 *     onLogout={() => authClient.signOut()}
 *   />
 *
 * Because `user` comes from the live session, the navbar updates
 * immediately when auth state changes.
 *
 * If you use the newer package, change the import to: "motion/react".
 */

import { authClient } from "@/lib/auth-client";
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
  Flower2,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Types & data
type Role = "admin" | "vendor" | "customer";

export interface NavUser {
  name: string;
  image?: string | null;
  role?: Role | string;
}

// interface MegaNavbarProps {
//   user: NavUser | null;
//   onLogout?: () => void | Promise<void>;
// }

const CATEGORIES = [
  {
    name: "Photography & Videography",
    desc: "Capture every moment",
    icon: Camera,
  },
  { name: "Wedding Venues", desc: "Halls, gardens & resorts", icon: Building2 },
  {
    name: "Decoration & Florist",
    desc: "Stages, flowers & lighting",
    icon: Flower2,
  },
  {
    name: "Catering Services",
    desc: "Menus guests will remember",
    icon: UtensilsCrossed,
  },
  { name: "Makeup & Styling", desc: "Bridal & groom looks", icon: Sparkles },
  { name: "Wedding Fashion", desc: "Outfits & accessories", icon: Shirt },
] as const;

const POPULAR_LOCATIONS = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Cox's Bazar",
];

const catHref = (c: string) => `/services?category=${encodeURIComponent(c)}`;
const locHref = (l: string) => `/services?location=${encodeURIComponent(l)}`;

const dashboardHref = (role?: string) =>
  role === "admin"
    ? "/dashboard/admin"
    : role === "vendor"
      ? "/dashboard/vendor"
      : "/dashboard/customer";

// Animations
const panelVariants: Variants = {
  hidden: { opacity: 0, y: -12, scale: 0.98, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 30,
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    filter: "blur(4px)",
    transition: { duration: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 28 },
  },
};

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.95, transformOrigin: "top right" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 420, damping: 28 },
  },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } },
};

const drawerList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
};

const drawerItem: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 350, damping: 28 },
  },
};

// Logo
function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2"
      aria-label="WedPlan home"
    >
      <motion.span
        whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
        className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-rose-400 to-rose-600 text-white shadow-md shadow-rose-300/40"
      >
        <Heart className="h-4 w-4 fill-white" />
      </motion.span>
      <span className="font-serif text-xl font-semibold tracking-tight text-neutral-900">
        Wed<span className="text-rose-500">Plan</span>
      </span>
    </Link>
  );
}

// Avatar
function Avatar({ user, size = 36 }: { user: NavUser; size?: number }) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return user.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.image}
      alt={user.name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover ring-2 ring-rose-200"
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="grid place-items-center rounded-full bg-rose-100 text-xs font-semibold text-rose-600 ring-2 ring-rose-200"
    >
      {initials}
    </span>
  );
}

// Main component
function SlidingPill({ visible }: { visible: boolean }) {
  return visible ? (
    <motion.span
      layoutId="nav-pill"
      className="absolute inset-0 -z-10 rounded-full bg-rose-50"
      transition={{ type: "spring", stiffness: 500, damping: 36 }}
    />
  ) : null;
}

/* export default function MegaNavbar({ user, onLogout }: MegaNavbarProps) { */

export default function MegaNavbar() {
  const pathname = usePathname();
  return <MegaNavbarContent key={pathname} pathname={pathname} />;
}

function MegaNavbarContent({ pathname }: { pathname: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [hoverLink, setHoverLink] = useState<string | null>(null);
  const [hoverCat, setHoverCat] = useState<string | null>(null);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  /* Scroll behaviour */
  const { scrollY, scrollYProgress } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 20));
  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    mass: 0.3,
  });

  const { data: session } = authClient.useSession();
  const user = session?.user
    ? {
        name: session.user.name,
        image: session.user.image,
        role: (session.user as typeof session.user & { role?: NavUser["role"] })
          .role,
      }
    : null;

  /* Hover intent for the mega menu (prevents flicker) */
  const openMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  }, []);
  const closeMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 140);
  }, []);

  /* Reset pending hover-close work when this route-specific navbar unmounts. */
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  /* Escape + click outside */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  /* Lock body scroll while mobile drawer is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (active: boolean) =>
    `relative z-10 flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      active ? "text-rose-600" : "text-neutral-700 hover:text-neutral-900"
    }`;

  const handleLogout = async () => {
    setProfileOpen(false);
    setMobileOpen(false);
    // await onLogout?.();

    await authClient.signOut();
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <motion.div
          animate={{
            height: scrolled ? 64 : 80,
            backgroundColor: scrolled
              ? "rgba(255,255,255,0.82)"
              : "rgba(255,255,255,0.96)",
            boxShadow: scrolled
              ? "0 8px 30px -12px rgba(244,63,94,0.25)"
              : "0 0 0 0 rgba(0,0,0,0)",
          }}
          transition={{ duration: 0.25 }}
          className="border-b border-rose-100/70 backdrop-blur-xl"
        >
          <nav
            className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
            aria-label="Main navigation"
          >
            <Logo />

            {/* Desktop links */}
            <ul
              className="hidden items-center gap-1 lg:flex"
              onMouseLeave={() => setHoverLink(null)}
            >
              <li onMouseEnter={() => setHoverLink("home")}>
                <Link href="/" className={linkClass(isActive("/"))}>
                  <SlidingPill visible={hoverLink === "home"} />
                  Home
                </Link>
              </li>

              {/* Mega trigger */}
              <li
                onMouseEnter={() => {
                  setHoverLink("services");
                  openMega();
                }}
                onMouseLeave={closeMega}
                className="relative"
              >
                <Link
                  href="/services"
                  className={linkClass(isActive("/services"))}
                  aria-haspopup="true"
                  aria-expanded={megaOpen}
                  onFocus={openMega}
                >
                  <SlidingPill visible={hoverLink === "services"} />
                  Browse Services
                  <motion.span
                    animate={{ rotate: megaOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </Link>
              </li>

              {!user && (
                <>
                  <li onMouseEnter={() => setHoverLink("signin")}>
                    <Link
                      href="/signin"
                      className={linkClass(isActive("/signin"))}
                    >
                      <SlidingPill visible={hoverLink === "signin"} />
                      Sign In
                    </Link>
                  </li>
                  <li className="ml-2">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href="/signup"
                        className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-rose-500 to-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-rose-300/50"
                      >
                        Sign Up
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </motion.div>
                  </li>
                </>
              )}
            </ul>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user && (
                <div ref={profileRef} className="relative hidden lg:block">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setProfileOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-rose-50"
                  >
                    <Avatar user={user} />
                    <span className="max-w-27.5 truncate text-sm font-medium text-neutral-800">
                      {user.name}
                    </span>

                    <motion.span animate={{ rotate: profileOpen ? 180 : 0 }}>
                      <ChevronDown className="h-4 w-4 text-neutral-500" />
                    </motion.span>
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        role="menu"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-rose-100 bg-white p-2 shadow-xl shadow-rose-200/40"
                      >
                        <div className="flex items-center gap-3 rounded-xl bg-rose-50/70 p-3">
                          <Avatar user={user} size={44} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-900">
                              {user.name}
                            </p>
                            {user.role && (
                              <p className="text-xs capitalize text-rose-600">
                                {user.role}
                              </p>
                            )}
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
                              href:
                                user.role === "admin"
                                  ? dashboardHref(user.role)
                                  : `${dashboardHref(user.role)}/profile`,
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
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-rose-50 hover:text-rose-600"
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
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-red-50 hover:text-red-600"
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

              {/* Animated hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-rose-50 lg:hidden"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={mobileOpen ? "x" : "menu"}
                    initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.18 }}
                  >
                    {mobileOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>
          </nav>

          {/* Scroll progress bar */}
          <motion.div
            style={{ scaleX: progress }}
            className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-linear-to-r from-rose-300 via-rose-500 to-amber-400"
          />
        </motion.div>

        {/* MEGA PANEL */}
        <AnimatePresence>
          {megaOpen && (
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              onMouseEnter={openMega}
              onMouseLeave={closeMega}
              className="absolute inset-x-0 top-full hidden lg:block"
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mt-2 grid grid-cols-12 gap-6 rounded-3xl border border-rose-100 bg-white/95 p-6 shadow-2xl shadow-rose-200/40 backdrop-blur-xl">
                  {/* Categories */}
                  <div className="col-span-7">
                    <motion.p
                      variants={itemVariants}
                      className="mb-3 text-xs font-semibold uppercase tracking-widest text-rose-500"
                    >
                      Explore by category
                    </motion.p>
                    <div
                      className="grid grid-cols-2 gap-2"
                      onMouseLeave={() => setHoverCat(null)}
                    >
                      {CATEGORIES.map(({ name, desc, icon: Icon }) => (
                        <motion.div
                          key={name}
                          variants={itemVariants}
                          onMouseEnter={() => setHoverCat(name)}
                        >
                          <Link
                            href={catHref(name)}
                            className="relative flex items-start gap-3 rounded-2xl p-3"
                          >
                            {hoverCat === name && (
                              <motion.span
                                layoutId="cat-highlight"
                                className="absolute inset-0 rounded-2xl bg-rose-50 ring-1 ring-rose-100"
                                transition={{
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 38,
                                }}
                              />
                            )}

                            <motion.span
                              animate={
                                hoverCat === name
                                  ? { rotate: -8, scale: 1.12 }
                                  : { rotate: 0, scale: 1 }
                              }
                              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600"
                            >
                              <Icon className="h-5 w-5" />
                            </motion.span>

                            <span className="relative">
                              <span className="flex items-center gap-1 text-sm font-semibold text-neutral-900">
                                {name}
                                <motion.span
                                  animate={
                                    hoverCat === name
                                      ? { x: 3, opacity: 1 }
                                      : { x: -4, opacity: 0 }
                                  }
                                >
                                  <ArrowRight className="h-3.5 w-3.5 text-rose-500" />
                                </motion.span>
                              </span>

                              <span className="text-xs text-neutral-500">
                                {desc}
                              </span>
                            </span>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="col-span-2">
                    <motion.p
                      variants={itemVariants}
                      className="mb-3 text-xs font-semibold uppercase tracking-widest text-rose-500"
                    >
                      Popular cities
                    </motion.p>

                    <ul className="space-y-1">
                      {POPULAR_LOCATIONS.map((loc) => (
                        <motion.li key={loc} variants={itemVariants}>
                          <Link
                            href={locHref(loc)}
                            className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-600 transition-colors hover:text-rose-600"
                          >
                            <MapPin className="h-3.5 w-3.5 text-rose-300 transition-transform group-hover:scale-125 group-hover:text-rose-500" />
                            {loc}
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Promo card */}
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    className="relative col-span-3 overflow-hidden rounded-2xl bg-linear-to-br from-rose-500 via-rose-600 to-pink-700 p-5 text-white"
                  >
                    <motion.div
                      aria-hidden
                      animate={{
                        scale: [1, 1.25, 1],
                        opacity: [0.25, 0.4, 0.25],
                      }}
                      transition={{ duration: 6, repeat: Infinity }}
                      className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/30 blur-2xl"
                    />

                    <Heart className="relative mb-3 h-6 w-6 fill-white/90" />

                    <h3 className="relative font-serif text-lg font-semibold leading-snug">
                      Plan your dream wedding, stress-free
                    </h3>
                    <p className="relative mt-1 text-xs text-rose-50/90">
                      Compare verified vendors and send booking requests in
                      minutes.
                    </p>

                    <Link
                      href="/services"
                      className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-rose-600 transition-transform hover:scale-105"
                    >
                      View all services <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Dim backdrop behind mega menu */}
      <AnimatePresence>
        {megaOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-40 hidden bg-neutral-900/10 backdrop-blur-[1px] lg:block"
          />
        )}
      </AnimatePresence>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-55 bg-neutral-900/40 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed right-0 top-0 z-60 flex h-full w-[85%] max-w-sm flex-col bg-white shadow-2xl lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-rose-100 px-5">
                <Logo />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-rose-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <motion.ul
                variants={drawerList}
                initial="hidden"
                animate="show"
                className="flex-1 space-y-1 overflow-y-auto p-4"
              >
                {user && (
                  <motion.li
                    variants={drawerItem}
                    className="mb-3 flex items-center gap-3 rounded-2xl bg-rose-50 p-3"
                  >
                    <Avatar user={user} size={44} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {user.name}
                      </p>
                      {user.role && (
                        <p className="text-xs capitalize text-rose-600">
                          {user.role}
                        </p>
                      )}
                    </div>
                  </motion.li>
                )}

                <motion.li variants={drawerItem}>
                  <Link
                    href="/"
                    className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-rose-50"
                  >
                    Home
                  </Link>
                </motion.li>

                <motion.li variants={drawerItem}>
                  <button
                    onClick={() => setMobileServicesOpen((v) => !v)}
                    aria-expanded={mobileServicesOpen}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium hover:bg-rose-50"
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
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 py-1 pl-3">
                          <Link
                            href="/services"
                            className="block rounded-lg px-4 py-2 text-sm font-medium text-rose-600"
                          >
                            All services
                          </Link>

                          {CATEGORIES.map(({ name, icon: Icon }) => (
                            <Link
                              key={name}
                              href={catHref(name)}
                              className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm text-neutral-600 hover:bg-rose-50"
                            >
                              <Icon className="h-4 w-4 text-rose-500" />
                              {name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>

                {user ? (
                  <>
                    <motion.li variants={drawerItem}>
                      <Link
                        href={dashboardHref(user.role)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-rose-50"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                    </motion.li>

                    <motion.li variants={drawerItem}>
                      <Link
                        href={
                          user.role === "admin"
                            ? dashboardHref(user.role)
                            : `${dashboardHref(user.role)}/profile`
                        }
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-rose-50"
                      >
                        <Settings className="h-4 w-4" /> Profile Settings
                      </Link>
                    </motion.li>

                    <motion.li variants={drawerItem}>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </motion.li>
                  </>
                ) : (
                  <>
                    <motion.li variants={drawerItem}>
                      <Link
                        href="/signin"
                        className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-rose-50"
                      >
                        Sign In
                      </Link>
                    </motion.li>

                    <motion.li variants={drawerItem} className="pt-2">
                      <Link
                        href="/signup"
                        className="flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-rose-500 to-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-rose-300/50"
                      >
                        Sign Up <ArrowRight className="h-4 w-4" />
                      </Link>
                    </motion.li>
                  </>
                )}
              </motion.ul>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
