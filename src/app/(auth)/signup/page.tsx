"use client";

/** Place at: app/signup/page.tsx */

import {
  AuthShell,
  EMAIL_RE,
  Field,
  FormHeading,
  GoogleButton,
  OrDivider,
  SubmitButton,
  dashboardFor,
  safeRedirect,
} from "@/components/auth/auth-ui";
import { ImageUpload } from "@/components/auth/image-upload";
import { authClient } from "@/lib/auth-client";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Check,
  Heart,
  Lock,
  Mail,
  Store,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

type Role = "customer" | "vendor";

/* ----------------------------- Password rules ---------------------------- */

const RULES = [
  {
    id: "len",
    label: "At least 6 characters",
    test: (p: string) => p.length >= 6,
  },
  {
    id: "upper",
    label: "One uppercase letter",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "One lowercase letter",
    test: (p: string) => /[a-z]/.test(p),
  },
];

const strengthOf = (p: string) => {
  let s = RULES.filter((r) => r.test(p)).length; // 0-3
  if (/[0-9]|[^A-Za-z0-9]/.test(p) && p.length >= 8) s += 1; // bonus
  return s; // 0-4
};
const STRENGTH_LABEL = ["Too weak", "Weak", "Okay", "Good", "Strong"];
const STRENGTH_COLOR = [
  "bg-muted",
  "bg-destructive",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
];

function PasswordMeter({ password }: { password: string }) {
  const score = strengthOf(password);
  return (
    <AnimatePresence>
      {password.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                >
                  <motion.div
                    initial={false}
                    animate={{ width: score >= n ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                    className={`h-full ${STRENGTH_COLOR[score]}`}
                  />
                </div>
              ))}
              <span className="ml-2 w-14 text-right text-xs font-medium text-muted-foreground">
                {STRENGTH_LABEL[score]}
              </span>
            </div>
            <ul className="grid gap-1 sm:grid-cols-3">
              {RULES.map((r) => {
                const ok = r.test(password);
                return (
                  <li
                    key={r.id}
                    className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                      ok
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    <motion.span
                      animate={{ scale: ok ? [1, 1.4, 1] : 1 }}
                      className={`grid h-3.5 w-3.5 place-items-center rounded-full ${
                        ok
                          ? "bg-emerald-500 text-white"
                          : "border border-border"
                      }`}
                    >
                      {ok && <Check className="h-2.5 w-2.5" />}
                    </motion.span>
                    {r.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------ Role selector ---------------------------- */

const ROLES: { id: Role; title: string; desc: string; icon: typeof Heart }[] = [
  {
    id: "customer",
    title: "Customer",
    desc: "I'm planning a wedding",
    icon: Heart,
  },
  {
    id: "vendor",
    title: "Vendor",
    desc: "I offer wedding services",
    icon: Store,
  },
];

function RoleSelector({
  value,
  onChange,
}: {
  value: Role;
  onChange: (r: Role) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Account role"
      className="grid grid-cols-2 gap-3"
    >
      {ROLES.map(({ id, title, desc, icon: Icon }) => {
        const active = value === id;
        return (
          <motion.button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="relative rounded-xl border border-border bg-card/70 p-3.5 text-left backdrop-blur"
          >
            {active && (
              <motion.span
                layoutId="role-active"
                className="absolute inset-0 rounded-xl border-2 border-brand bg-brand-soft/60"
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            )}
            <span className="relative flex flex-col gap-2">
              <span
                className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${
                  active
                    ? "bg-brand text-brand-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${active && id === "customer" ? "fill-current" : ""}`}
                />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-xs text-muted-foreground">
                  {desc}
                </span>
              </span>
            </span>
            <AnimatePresence>
              {active && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-brand text-brand-foreground"
                >
                  <Check className="h-3 w-3" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

/* --------------------------------- Form ---------------------------------- */

type Errors = Partial<
  Record<"name" | "email" | "password" | "businessName", string>
>;

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = safeRedirect(params.get("redirect"));
  const shake = useAnimationControls();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [businessName, setBusinessName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const fail = (msg: string) => {
    toast.error(msg);
    shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
  };

  const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (uploading)
      return void toast.info("Please wait for your photo to finish uploading");

    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Please enter your full name";
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address";
    if (!RULES.every((r) => r.test(password)))
      next.password = "Password doesn't meet all the requirements";
    if (role === "vendor" && businessName.trim().length < 2)
      next.businessName = "Business name is required for vendors";
    setErrors(next);
    if (Object.keys(next).length) {
      shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.signUp.email({
        name: name.trim(),
        email,
        password,
        image: imageUrl ?? undefined,
        // Server MUST validate this: only "customer" or "vendor" are ever accepted
        role,
        ...(role === "vendor" ? { businessName: businessName.trim() } : {}),
      } as Parameters<typeof authClient.signUp.email>[0]);

      if (error) {
        fail(error.message || "Could not create your account");
        return;
      }

      toast.success("Account created! Welcome to WedPlan 🎉");
      router.replace(redirectTo ?? dashboardFor(role));
      router.refresh();
    } catch {
      fail("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    if (role === "vendor" && !businessName?.trim()) {
      toast.error(
        "Please enter your business name before continuing with Google.",
      );
      return;
    }

    setGoogleLoading(true);

    try {
      toast.loading(`Redirecting to Google to create your ${role} account…`, {
        id: "google-signup",
      });

      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo ?? "/dashboard",
        additionalData: {
          role, // "customer" | "vendor" from your role selector
          businessName: role === "vendor" ? businessName : undefined,
        },
      });
    } catch {
      toast.error("Google sign-up failed. Please try again.", {
        id: "google-signup",
      });

      setGoogleLoading(false);
    }
  };

  return (
    <>
      <FormHeading
        title="Create your account"
        subtitle="Join WedPlan and make every wedding detail effortless."
      />

      {/* <p
        role="status"
        className="mb-3 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-xs leading-relaxed text-foreground"
      >
        {role === "vendor"
          ? "Google sign-up will create a Vendor account. Enter your business name in this form first."
          : "Google sign-up will create a Customer account. To join as a Vendor, switch your role to Vendor first."}
      </p> */}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={role}
          role="status"
          initial={{ opacity: 0, y: -12, rotateX: -40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, rotateX: 30, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          style={{ transformPerspective: 700, transformOrigin: "top center" }}
          className="relative mb-3 flex items-start gap-3 overflow-hidden rounded-2xl border border-brand/30 bg-brand-soft px-4 py-3.5 text-xs leading-relaxed text-foreground"
        >
          {/* icon with a soft pulsing ring */}
          <span className="relative shrink-0">
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-xl bg-brand"
              animate={{ scale: [1, 1.7], opacity: [0.45, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />

            <motion.span
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 15,
                delay: 0.1,
              }}
              className="relative grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground shadow-md"
            >
              {role === "vendor" ? (
                <Store className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </motion.span>
          </span>

          {/* text fades up after the card lands */}
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative pt-0.5"
          >
            {role === "vendor"
              ? "Google sign-up will create a Vendor account. Enter your business name in this form first."
              : "Google sign-up will create a Customer account. To join as a Vendor, switch your role to Vendor first."}
          </motion.span>

          {/* accent line that draws itself along the bottom */}
          <motion.span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-linear-to-r from-(--logo-from) to-(--logo-to)"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          />
        </motion.div>
      </AnimatePresence>

      <GoogleButton
        loading={googleLoading}
        onClick={onGoogle}
        label="Sign up with Google"
      />
      <OrDivider />

      <motion.form
        animate={shake}
        onSubmit={onSubmit}
        noValidate
        className="space-y-4"
      >
        <RoleSelector value={role} onChange={setRole} />

        <Field
          id="name"
          label="Full name"
          icon={User}
          value={name}
          onChange={setName}
          error={errors.name}
          autoComplete="name"
        />

        <AnimatePresence initial={false}>
          {role === "vendor" && (
            <motion.div
              key="biz"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Field
                id="businessName"
                label="Business name"
                icon={Briefcase}
                value={businessName}
                onChange={setBusinessName}
                error={errors.businessName}
                autoComplete="organization"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Field
          id="email"
          label="Email address"
          type="email"
          icon={Mail}
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
        />

        <div className="space-y-2">
          <Field
            id="password"
            label="Password"
            type="password"
            icon={Lock}
            value={password}
            onChange={setPassword}
            error={errors.password}
            autoComplete="new-password"
          />
          <PasswordMeter password={password} />
        </div>

        <ImageUpload onChange={setImageUrl} onBusyChange={setUploading} />

        <div className="pt-2">
          <SubmitButton loading={loading || uploading}>
            {loading
              ? "Creating account…"
              : uploading
                ? "Uploading photo…"
                : "Create Account"}
            {!loading && !uploading && <ArrowRight className="h-4 w-4" />}
          </SubmitButton>
        </div>
      </motion.form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={
            redirectTo
              ? `/signin?redirect=${encodeURIComponent(redirectTo)}`
              : "/signin"
          }
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function SignUpPage() {
  return (
    <AuthShell mode="signup">
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}
      >
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}

/* <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={role}
          role="status"
          initial={{ opacity: 0, y: -12, rotateX: -40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, rotateX: 30, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          style={{ transformPerspective: 700, transformOrigin: "top center" }}
          className="relative mb-3 flex items-start gap-3 overflow-hidden rounded-2xl border border-brand/30 bg-brand-soft px-4 py-3.5 text-xs leading-relaxed text-foreground"
        >
          // shimmer sweep each time the role changes
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-white/40"
            initial={{ left: "-40%" }}
            animate={{ left: "140%" }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          />

          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 15,
              delay: 0.1,
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground shadow-md"
          >
            {role === "vendor" ? (
              <Store className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </motion.span>

          <span className="relative pt-0.5">
            {role === "vendor"
              ? "Google sign-up will create a Vendor account. Enter your business name in this form first."
              : "Google sign-up will create a Customer account. To join as a Vendor, switch your role to Vendor first."}
          </span>
        </motion.div>
      </AnimatePresence>
*/
