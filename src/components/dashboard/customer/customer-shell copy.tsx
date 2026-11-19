"use client";

/**
 * WedPlan - Customer dashboard layout (sidebar + main area)
 * Place at: components/dashboard/customer/customer-shell.tsx
 * Used by: app/dashboard/customer/layout.tsx
 *
 * Route protection (client side, for UX):
 *  - signed out         -> /signin?redirect=<this page>
 *  - blocked account    -> "account blocked" screen, no dashboard access
 *  - vendor / admin     -> sent to THEIR dashboard (cannot open the customer dashboard by editing the URL)
 * The Express API must enforce the same rules with JWT + role middleware: hiding UI is not security.
 */

import { dashboardFor } from "@/components/auth/auth-ui";
import { authClient } from "@/lib/auth-client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarCheck,
  Compass,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  UserCog,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Avatar,
  BrandMark,
  useCustomerUser,
  type CustomerUser,
} from "./customer-shared";

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
        <BrandMark />
      </motion.div>
    </div>
  );
}

function SidebarBody({
  user,
  pathname,
  onNavigate,
  onSignOut,
}: {
  user: CustomerUser;
  pathname: string;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link href="/" onClick={onNavigate} aria-label="WedPlan home">
        <BrandMark />
      </Link>

      {/* user card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-br from-brand-soft to-card p-4 shadow-sm"
      >
        <div
          aria-hidden
          className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/20 blur-2xl"
        />
        <div className="relative flex items-center gap-3">
          <Avatar
            src={user.image}
            name={user.name}
            size={48}
            className="ring-2 ring-brand/40"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
            <span className="mt-1.5 inline-flex rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-foreground">
              Customer
            </span>
          </div>
        </div>
      </motion.div>

      {/* nav */}
      <nav aria-label="Dashboard" className="flex flex-col gap-1.5">
        {NAV.map((item, i) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
            >
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand ${
                  active
                    ? "text-brand-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="customer-nav-pill"
                    className="absolute inset-0 rounded-2xl bg-linear-to-r from-(--logo-from) to-brand shadow-lg shadow-brand/30"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <item.icon className="relative h-5 w-5 transition-transform group-hover:scale-110" />
                <span className="relative">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1.5 border-t border-border pt-4">
        <Link
          href="/services"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Compass className="h-4 w-4" /> Browse services
        </Link>
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Home className="h-4 w-4" /> Back to website
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
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
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = useCallback(
    (value: boolean) => setOpenPath(value ? pathname : null),
    [pathname],
  );

  const role = user?.role ?? "customer";

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
  }, [open, setOpen]);

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
      <aside className="sticky top-0 z-30 hidden h-screen w-72 shrink-0 border-r border-border bg-card/80 backdrop-blur-xl lg:block">
        <SidebarBody user={user} pathname={pathname} onSignOut={signOut} />
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <BrandMark />
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
                className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-full bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarBody
                user={user}
                pathname={pathname}
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
