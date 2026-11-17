"use client";

/** Place at: app/signin/page.tsx */

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
import { authClient } from "@/lib/auth-client";
import { motion, useAnimationControls } from "framer-motion";
import { ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = safeRedirect(params.get("redirect"));
  const shake = useAnimationControls();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const fail = (msg: string) => {
    toast.error(msg);
    shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: typeof errors = {};
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address";
    if (!password) next.password = "Password is required";
    setErrors(next);
    if (Object.keys(next).length) {
      shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        fail(error.message || "Invalid email or password");
        return;
      }

      // Read the role from the session so we can redirect by role
      const session = await authClient.getSession();
      const user = session.data?.user as
        | { role?: string; isBlocked?: boolean }
        | undefined;

      if (user?.isBlocked) {
        await authClient.signOut();
        fail("Your account has been blocked. Please contact support.");
        return;
      }

      toast.success("Welcome back!");
      router.replace(redirectTo ?? dashboardFor(user?.role));
      router.refresh();
    } catch {
      fail("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    try {
      // /dashboard redirects to the correct role dashboard (see dashboard-redirect.tsx)
      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo ?? "/dashboard",
      });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <FormHeading
        title="Sign in"
        subtitle="Welcome back! Enter your details to continue planning."
      />

      <GoogleButton
        loading={googleLoading}
        onClick={onGoogle}
        label="Continue with Google"
      />
      <OrDivider />

      <motion.form
        animate={shake}
        onSubmit={onSubmit}
        noValidate
        className="space-y-4"
      >
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
        <Field
          id="password"
          label="Password"
          type="password"
          icon={Lock}
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="pt-2">
          <SubmitButton loading={loading}>
            {loading ? "Signing in…" : "Sign In"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </SubmitButton>
        </div>
      </motion.form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to WedPlan?{" "}
        <Link
          href={
            redirectTo
              ? `/signup?redirect=${encodeURIComponent(redirectTo)}`
              : "/signup"
          }
          className="font-semibold text-brand underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}

export default function SignInPage() {
  return (
    <AuthShell mode="signin">
      {/* useSearchParams needs a Suspense boundary in production builds */}
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}
      >
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
