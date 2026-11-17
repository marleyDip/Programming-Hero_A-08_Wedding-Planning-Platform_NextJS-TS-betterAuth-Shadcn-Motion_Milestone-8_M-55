"use client";

/**
 * Shared UI for the Sign In / Sign Up pages.
 * Place at: components/auth/auth-ui.tsx
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CalendarCheck,
  Camera,
  Check,
  Eye,
  EyeOff,
  Flower2,
  Heart,
  Loader2,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

// Left visual panel
const SLIDES = [
  {
    icon: Camera,
    title: "Discover trusted vendors",
    text: "Photographers, venues, decorators and more, all in one place.",
  },
  {
    icon: CalendarCheck,
    title: "Book in minutes",
    text: "Send a booking request with your event date and location.",
  },
  {
    icon: ShieldCheck,
    title: "Stay in control",
    text: "Track every request from pending to confirmed, right from your dashboard.",
  },
];

const FLOATERS: {
  icon: LucideIcon;
  className: string;
  dur: number;
  delay: number;
}[] = [
  { icon: Heart, className: "left-[12%] top-[18%] h-8 w-8", dur: 6, delay: 0 },
  {
    icon: Flower2,
    className: "right-[14%] top-[26%] h-10 w-10",
    dur: 7.5,
    delay: 0.8,
  },
  {
    icon: Sparkles,
    className: "left-[22%] top-[58%] h-7 w-7",
    dur: 5.5,
    delay: 1.4,
  },
  {
    icon: Camera,
    className: "right-[20%] top-[62%] h-8 w-8",
    dur: 8,
    delay: 0.4,
  },
];

function VisualPanel({ mode }: { mode: "signin" | "signup" }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 4200);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[i];

  return (
    <aside className="relative hidden overflow-hidden bg-linear-to-br from-(--logo-from) to-(--logo-to) text-(--logo-fg) lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-end lg:p-12">
      {/* depth overlay for text legibility */}
      <div className="absolute inset-0 bg-linear-to-t from-black/30 via-black/5 to-transparent" />

      {/* Slowly rotating rings (echoes the logo) */}
      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute -right-40 -top-40 h-136 w-136 rounded-full border-[3px] border-current opacity-10"
      />

      <motion.div
        aria-hidden
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute -left-32 top-1/3 h-112 w-md rounded-full border-[3px] border-current opacity-10"
      />

      {/* Glow blobs */}
      <motion.div
        aria-hidden
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-10 top-20 h-72 w-72 rounded-full bg-white/30 blur-3xl"
      />

      <motion.div
        aria-hidden
        animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-white/20 blur-3xl"
      />

      {/* Floating wedding icons */}
      {FLOATERS.map(({ icon: Icon, className, dur, delay }, idx) => (
        <motion.div
          key={idx}
          aria-hidden
          animate={{ y: [0, -18, 0], rotate: [-6, 6, -6] }}
          transition={{
            duration: dur,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute opacity-40 ${className}`}
        >
          <Icon className="h-full w-full" />
        </motion.div>
      ))}

      {/* Floating notification card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 20 }}
        className="absolute right-12 top-36 w-60"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/20 p-3 backdrop-blur-md"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-emerald-600">
            <Check className="h-5 w-5" />
          </span>

          <div className="text-xs leading-snug">
            <p className="font-semibold">Booking accepted</p>
            <p className="opacity-80">Wedding Photography</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Headline + rotating feature */}
      <div className="relative z-10 max-w-md">
        <AnimatePresence mode="wait">
          <motion.h2
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="font-serif text-4xl font-semibold leading-tight xl:text-5xl"
          >
            {mode === "signin"
              ? "Welcome back to your wedding journey."
              : "Start planning the wedding of your dreams."}
          </motion.h2>
        </AnimatePresence>

        <div className="mt-8 min-h-27.5 rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-4"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/25">
                <slide.icon className="h-5 w-5" />
              </span>

              <div>
                <p className="font-semibold">{slide.title}</p>
                <p className="mt-0.5 text-sm opacity-85">{slide.text}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex gap-1.5">
            {SLIDES.map((_, idx) => (
              <motion.span
                key={idx}
                animate={{
                  width: idx === i ? 28 : 8,
                  opacity: idx === i ? 1 : 0.5,
                }}
                className="h-1.5 rounded-full bg-current"
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

// Page shell
export function AuthShell({
  mode,
  children,
}: {
  mode: "signin" | "signup";
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <VisualPanel mode={mode} />

      <main className="relative flex items-center justify-center overflow-hidden px-4 pb-12 pt-28 sm:px-8">
        {/* soft background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/15 blur-3xl"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gold/20 blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 20 }}
          className="relative w-full max-w-md"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

// Form primitives
export function FormHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
        className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-linear-to-br from-(--logo-from) to-(--logo-to) text-(--logo-fg) shadow-lg shadow-brand/30"
      >
        <Heart className="h-6 w-6 fill-current" />
      </motion.div>

      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        {title}
      </h1>

      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  autoComplete?: string;
}

/** Floating-label input with icon, focus glow, animated error and password toggle. */
export function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  error,
  autoComplete,
}: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand" />
        <input
          id={id}
          name={id}
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className={`peer h-14 w-full rounded-xl border bg-card/70 pl-10 pr-11 pt-5 text-sm outline-none backdrop-blur transition-all focus:bg-card focus:ring-4 ${
            error
              ? "border-destructive focus:ring-destructive/15"
              : "border-border focus:border-brand focus:ring-brand/15"
          }`}
        />

        <label
          htmlFor={id}
          className="pointer-events-none absolute left-10 top-2 origin-left text-[11px] font-medium text-muted-foreground transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-brand"
        >
          {label}
        </label>

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={show ? "off" : "on"}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="block"
              >
                {show ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 overflow-hidden pt-1.5 text-xs text-destructive"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.97 }}
      className="relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-(--logo-from) to-(--logo-to) text-sm font-semibold text-(--logo-fg) shadow-lg shadow-brand/30 disabled:cursor-not-allowed disabled:opacity-80"
    >
      <motion.span
        aria-hidden
        className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/35"
        initial={{ left: "-40%" }}
        animate={{ left: "140%" }}
        transition={{
          duration: 1.3,
          repeat: Infinity,
          repeatDelay: 2.5,
          ease: "easeInOut",
        }}
      />

      <span className="relative flex items-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </span>
    </motion.button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

export function GoogleButton({
  loading,
  onClick,
  label,
}: {
  loading: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium shadow-sm transition-colors hover:border-brand/40 hover:bg-accent disabled:opacity-70"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
      {label}
    </motion.button>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or continue with email
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

// Helpers
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dashboardFor = (role?: string | null) =>
  role === "admin"
    ? "/dashboard/admin"
    : role === "vendor"
      ? "/dashboard/vendor"
      : "/dashboard/customer";

/** Only allow same-site relative redirects (prevents open-redirect attacks). */
export const safeRedirect = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : null;
