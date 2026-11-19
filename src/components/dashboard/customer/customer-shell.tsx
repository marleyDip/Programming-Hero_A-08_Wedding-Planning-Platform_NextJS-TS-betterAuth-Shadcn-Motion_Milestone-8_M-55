"use client";

/**
 * WedPlan - Customer dashboard layout (sidebar + main area)
 * Place at: components/dashboard/customer/customer-shell.tsx
 * Used by: app/dashboard/customer/layout.tsx
 *
 * Sidebar
 *  - Desktop: collapsible (icon-only mode with tooltips), remembers your choice
 *  - User card with gradient border and online dot, "Menu" section, glowing active pill that
 *    slides between pages, lifting icon tiles, small promo card, quick links, sign out
 *  - Mobile: top bar + slide-in drawer (closes on navigation, Esc or backdrop tap)
 *
 * Route protection (client side, for UX):
 *  - signed out         -> /signin?redirect=<this page>
 *  - blocked account    -> "account blocked" screen, no dashboard access
 *  - vendor / admin     -> sent to THEIR dashboard (cannot open the customer dashboard by editing the URL)
 * The Express API must enforce the same rules with JWT + role middleware: hiding UI is not security.
 */

import { dashboardFor } from "@/components/auth/auth-ui";
import { Logo, LogoMark } from "@/components/shared/logo";
import { authClient } from "@/lib/auth-client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Compass,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  Sparkles,
  UserCog,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Avatar, useCustomerUser, type CustomerUser } from "./customer-shared";

const STORE_KEY = "wedplan-customer-sidebar";

function getCollapsedSnapshot() {
  try {
    return localStorage.getItem(STORE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeCollapsed(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("wedplan-sidebar-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("wedplan-sidebar-change", callback);
  };
}

const NAV: {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}[] = [
  {
    href: "/dashboard/customer",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/customer/bookings",
    label: "My Bookings",
    icon: CalendarCheck,
  },
  {
    href: "/dashboard/customer/profile",
    label: "Profile Settings",
    icon: UserCog,
  },
];

function FullLoader() {
  return (
    <div
      className="grid min-h-screen place-items-center"
      role="status"
      aria-label="Loading dashboard"
    >
      <motion.div
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        {/* <BrandMark /> */}
        <Logo />
      </motion.div>
    </div>
  );
}

/** Tooltip shown only while the sidebar is collapsed. */
function Tip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null;

  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-4 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-xl bg-foreground px-3 py-2 text-xs font-semibold text-background opacity-0 shadow-xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}

function SideAction({
  icon: Icon,
  label,
  collapsed,
  href,
  onClick,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const cls = `group relative flex items-center rounded-2xl text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
    collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
  } ${danger ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`;

  const inner = (
    <>
      <Icon className="h-4.5 w-4.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />

      {!collapsed && <span className="whitespace-nowrap">{label}</span>}

      <Tip label={label} show={collapsed} />
    </>
  );

  return href ? (
    <Link
      href={href}
      onClick={onClick}
      className={cls}
      aria-label={collapsed ? label : undefined}
    >
      {inner}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className={`${cls} w-full text-left`}
      aria-label={collapsed ? label : undefined}
    >
      {inner}
    </button>
  );
}

function SidebarBody({
  user,
  pathname,
  collapsed,
  onNavigate,
  onSignOut,
}: {
  user: CustomerUser;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <div
      className={`flex h-full flex-col gap-5 py-5 ${collapsed ? "px-3" : "px-4"}`}
    >
      {/* Brand */}
      {collapsed ? (
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="WedPlan home"
          className="flex items-center justify-center outline-none"
        >
          <LogoMark />
        </Link>
      ) : (
        <div className="flex items-center px-1">
          <Logo />
        </div>
      )}

      {/* brand */}
      {/* <div
        className={`flex items-center ${collapsed ? "justify-center" : "px-1"}`}
      >
        {collapsed ? <LogoMark /> : <Logo />}
      </div> */}

      {/* user card */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={reduce ? undefined : { y: -2 }}
        className="relative rounded-3xl bg-linear-to-br from-(--logo-from) via-brand to-(--logo-to) p-[1.5px] shadow-lg shadow-brand/15"
      >
        <div
          className={`relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-card ${collapsed ? "p-2" : "p-3.5"}`}
        >
          <div
            aria-hidden
            className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/15 blur-2xl"
          />

          <div
            className={`relative flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
          >
            <span className="relative shrink-0">
              <Avatar
                src={user.image}
                name={user.name}
                size={collapsed ? 40 : 46}
                className="ring-2 ring-card"
              />

              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-card">
                {!reduce && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-success"
                    animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                )}
              </span>
            </span>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
                <span className="mt-1.5 inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                  Customer
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* menu */}
      <div>
        {!collapsed ? (
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70">
            Menu
          </p>
        ) : (
          <span aria-hidden className="mx-auto mb-3 block h-px w-8 bg-border" />
        )}

        <nav aria-label="Dashboard" className="flex flex-col gap-1.5">
          {NAV.map((item, i) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <motion.div
                key={item.href}
                initial={reduce ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
              >
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={`group relative flex items-center rounded-2xl text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
                    collapsed ? "justify-center py-2.5" : "gap-3 px-2.5 py-2"
                  } ${active ? "text-brand-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {active ? (
                    <motion.span
                      layoutId="customer-nav-pill"
                      className="absolute inset-0 rounded-2xl bg-linear-to-r from-(--logo-from) to-brand shadow-lg shadow-brand/35"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 34,
                      }}
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-2xl bg-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    />
                  )}

                  <span
                    className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all duration-300 ${
                      active
                        ? "bg-white/20"
                        : "bg-muted group-hover:-translate-y-0.5 group-hover:bg-brand-soft group-hover:text-brand group-hover:shadow-md"
                    }`}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                  </span>

                  {!collapsed && (
                    <>
                      <span className="relative whitespace-nowrap">
                        {item.label}
                      </span>

                      {active && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="relative ml-auto"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.span>
                      )}
                    </>
                  )}

                  <Tip label={item.label} show={collapsed} />
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>

      {/* promo card (expanded only) */}
      {!collapsed && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={reduce ? undefined : { y: -3, rotateX: 5 }}
          style={{ transformPerspective: 600 }}
          className="relative mt-auto overflow-hidden rounded-3xl border border-border bg-linear-to-br from-brand-soft to-card p-4"
        >
          <motion.span
            aria-hidden
            animate={reduce ? undefined : { rotate: [0, 12, 0], y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-2 -top-2 text-brand/25"
          >
            <Sparkles className="h-16 w-16" />
          </motion.span>

          <p className="relative font-serif text-base font-semibold leading-snug">
            Need more ideas?
          </p>
          <p className="relative mt-1 text-xs leading-relaxed text-muted-foreground">
            Discover verified photographers, venues and decorators.
          </p>

          <Link
            href="/services"
            onClick={onNavigate}
            className="relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-xs font-semibold text-brand-foreground shadow-md shadow-brand/25 transition-transform hover:scale-105"
          >
            Browse services <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      )}

      {/* quick links */}
      <div
        className={`flex flex-col gap-1 border-t border-border pt-3 ${collapsed ? "mt-auto" : ""}`}
      >
        {collapsed && (
          <SideAction
            icon={Compass}
            label="Browse services"
            href="/services"
            collapsed
            onClick={onNavigate}
          />
        )}

        <SideAction
          icon={Home}
          label="Back to website"
          href="/"
          collapsed={collapsed}
          onClick={onNavigate}
        />

        <SideAction
          icon={LogOut}
          label="Sign out"
          collapsed={collapsed}
          onClick={onSignOut}
          danger
        />
      </div>
    </div>
  );
}

export default function CustomerShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { user, isPending } = useCustomerUser();
  const [open, setOpen] = useState(false);
  const [previousPathname, setPreviousPathname] = useState(pathname);

  if (pathname !== previousPathname) {
    setPreviousPathname(pathname);
    setOpen(false);
  }

  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    () => false,
  );

  const role = user?.role ?? "customer";

  // Persist the collapsed state as an external store.
  const toggleCollapsed = () => {
    try {
      localStorage.setItem(STORE_KEY, collapsed ? "0" : "1");
      window.dispatchEvent(new Event("wedplan-sidebar-change"));
    } catch {
      /* storage blocked: leave the current state unchanged */
    }
  };

  useEffect(() => {
    if (isPending) return;

    if (!user)
      router.replace(`/signin?redirect=${encodeURIComponent(pathname)}`);
    else if (!user.isBlocked && role !== "customer")
      router.replace(dashboardFor(role));
  }, [isPending, user, role, router, pathname]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const signOut = async () => {
    try {
      await authClient.signOut();
      toast.success("You've been signed out");
      router.push("/");
    } catch {
      toast.error("Couldn't sign out. Please try again.");
    }
  };

  if (isPending || !user) return <FullLoader />;

  if (user.isBlocked) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: -16 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          style={{ transformPerspective: 1000 }}
          className="max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-2xl"
        >
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-10 w-10" />
          </span>
          <h1 className="mt-6 font-serif text-2xl font-semibold">
            Your account is blocked
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You can&apos;t use the dashboard or send booking requests right now.
            Please contact support if you think this is a mistake.
          </p>

          <button
            type="button"
            onClick={signOut}
            className="mt-7 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground"
          >
            Sign out
          </button>
        </motion.div>
      </div>
    );
  }

  if (role !== "customer") return <FullLoader />;

  return (
    <div className="relative min-h-screen bg-background lg:flex">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 [background:radial-gradient(50%_40%_at_85%_0%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent_70%),radial-gradient(40%_30%_at_0%_100%,color-mix(in_oklab,var(--gold)_12%,transparent),transparent_70%)]"
      />

      {/* desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 88 : 288 }}
        transition={
          reduce
            ? { duration: 0 }
            : { type: "spring", stiffness: 260, damping: 30 }
        }
        className="sticky top-0 z-30 hidden h-screen shrink-0 border-r border-border bg-card/85 backdrop-blur-xl lg:block"
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="absolute -right-3.5 top-9 z-40 grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-all hover:scale-110 hover:border-brand hover:bg-brand hover:text-brand-foreground focus-visible:ring-2 focus-visible:ring-brand"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        <SidebarBody
          user={user}
          pathname={pathname}
          collapsed={collapsed}
          onSignOut={signOut}
        />
      </motion.aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        {/* <BrandMark /> */}
        <Logo />

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-card"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="bd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs overflow-y-auto border-r border-border bg-card shadow-2xl lg:hidden"
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-muted"
              >
                <X className="h-4 w-4" />
              </button>

              <SidebarBody
                user={user}
                pathname={pathname}
                collapsed={false}
                onNavigate={() => setOpen(false)}
                onSignOut={signOut}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* main */}
      <main className="relative z-10 min-w-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={
              reduce
                ? undefined
                : { opacity: 0, y: -12, transition: { duration: 0.12 } }
            }
            transition={{ type: "spring", stiffness: 140, damping: 22 }}
            className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* 
  <Link
    href="/"
    onClick={onNavigate}
    aria-label="WedPlan home"
    className={`flex items-center outline-none ${collapsed ? "justify-center" : "px-1"}`}
  >
    {collapsed ? (
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-linear-to-br from-(--logo-from) to-(--logo-to) text-(--logo-fg) shadow-lg shadow-brand/30">
        <span className="font-serif text-xl font-bold">W</span>
      </span>
    ) : (
      <BrandMark />
    )}
  </Link>

*/
