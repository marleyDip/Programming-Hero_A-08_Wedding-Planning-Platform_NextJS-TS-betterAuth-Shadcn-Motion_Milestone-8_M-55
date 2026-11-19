"use client";

/**
 * WedPlan - Customer Profile Settings
 * Place at: components/dashboard/customer/profile-settings.tsx
 * Used by: app/dashboard/customer/profile/page.tsx
 *
 * Editable: name, profile image (uploaded to ImgBB through /api/upload), phone, address.
 * Read-only: email and role (a locked card explains that role / subscription can't be changed here).
 * Saves with Better Auth `authClient.updateUser`. The server (auth.ts) ALSO rejects any attempt to
 * change role, isBlocked or subscription fields, so this is not just a hidden UI field.
 *
 * Needs `phone` and `address` as additionalFields in auth.ts (see the notes sent with this file).
 */

import { ImageUpload } from "@/components/auth/image-upload";
import { useTilt } from "@/components/home/section-kit";
import { authClient } from "@/lib/auth-client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  Check,
  Home,
  Loader2,
  Lock,
  Mail,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Avatar,
  PageHeader,
  formatDate,
  useCustomerUser,
} from "./customer-shared";

const PHONE_RE = /^\+?[0-9\s-]{7,18}$/;

interface Errors {
  name?: string;
  phone?: string;
  address?: string;
}

function Field({
  id,
  label,
  icon: Icon,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  icon: typeof User;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-2 text-sm font-semibold"
      >
        <Icon className="h-4 w-4 text-brand" /> {label}
      </label>
      {children}
      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <motion.p
            key="e"
            id={`${id}-msg`}
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive"
          >
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="h"
            id={`${id}-msg`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs text-muted-foreground"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const input = (err?: string) =>
  `w-full rounded-2xl border bg-background px-4 py-3.5 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/70 focus:ring-4 ${
    err
      ? "border-destructive focus:ring-destructive/20"
      : "border-border focus:border-brand focus:ring-brand/20"
  }`;

export default function ProfileSettings() {
  const reduce = useReducedMotion();
  const { user, refetch } = useCustomerUser();
  const { ref, style, glare, sx, sy, handlers } = useTilt(6, 20);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  // undefined = keep current photo, string = new photo, null = remove photo
  const [pendingImage, setPendingImage] = useState<string | null | undefined>(
    undefined,
  );
  const [uploading, setUploading] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const shownImage = pendingImage !== undefined ? pendingImage : user?.image;

  const dirty = useMemo(
    () =>
      !!user &&
      (name.trim() !== (user.name ?? "") ||
        phone.trim() !== (user.phone ?? "") ||
        address.trim() !== (user.address ?? "") ||
        pendingImage !== undefined),
    [user, name, phone, address, pendingImage],
  );

  if (!user) return null;

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 2)
      e.name = "Please enter your full name (at least 2 characters).";
    if (name.trim().length > 80)
      e.name = "Name is too long (80 characters max).";
    if (phone.trim() && !PHONE_RE.test(phone.trim()))
      e.phone = "Enter a valid phone number, e.g. +880 1712 345678.";
    if (address.trim().length > 160)
      e.address = "Address is too long (160 characters max).";
    return e;
  };

  const reset = () => {
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setAddress(user.address ?? "");
    setPendingImage(undefined);
    setUploaderKey((k) => k + 1);
    setErrors({});
  };

  const save = async (ev: React.SubmitEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    if (uploading) {
      toast.info("Please wait for the photo upload to finish.");
      return;
    }
    setBusy(true);
    try {
      // role / isBlocked / subscription fields are deliberately never sent
      const res = await authClient.updateUser({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        ...(pendingImage !== undefined ? { image: pendingImage } : {}),
      } as never);
      if (res?.error) throw new Error(res.error.message || "Update failed");

      await refetch?.();
      setPendingImage(undefined);
      setUploaderKey((k) => k + 1);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success("Profile updated", {
        description: "Your changes have been saved.",
      });
    } catch (e) {
      toast.error("Couldn't save your profile", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile Settings"
        subtitle="Keep your details up to date so vendors know who they're working with."
      />

      <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
        {/* profile card */}
        <div className="perspective-distant">
          <motion.aside
            ref={ref}
            {...handlers}
            style={style}
            initial={reduce ? false : { opacity: 0, y: 40, rotateX: -16 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 16 }}
            className="relative overflow-hidden rounded-4xl border border-border bg-card p-7 text-center shadow-2xl shadow-brand/10 lg:sticky lg:top-8"
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-28 bg-linear-to-br from-(--logo-from) via-brand to-[oklch(0.45_0.17_330)]"
            />
            <motion.div
              aria-hidden
              style={{ background: glare }}
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            />

            <motion.div
              style={{ x: sx, y: sy, transform: "translateZ(60px)" }}
              className="relative mx-auto mt-6 h-32 w-32"
            >
              {/* spinning ring */}
              <motion.span
                aria-hidden
                animate={reduce ? undefined : { rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-1.5 rounded-full [background:conic-gradient(from_0deg,var(--logo-from),var(--logo-to),var(--logo-from))]"
              />
              <span className="absolute inset-0 rounded-full bg-card" />
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={shownImage ?? "none"}
                  initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="absolute inset-1.5"
                >
                  <Avatar
                    src={shownImage}
                    name={name || user.name}
                    size={116}
                    className="h-full w-full"
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <h2
              className="relative mt-5 truncate font-serif text-2xl font-semibold"
              style={{ transform: "translateZ(30px)" }}
            >
              {name.trim() || user.name}
            </h2>
            <p className="relative truncate text-sm text-muted-foreground">
              {user.email}
            </p>
            <span className="relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-foreground">
              <User className="h-3 w-3" /> Customer
            </span>

            <dl className="relative mt-6 space-y-2 text-left text-sm">
              <div className="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3">
                <CalendarDays className="h-4 w-4 text-brand" />
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Member since
                  </dt>
                  <dd className="font-semibold">
                    {formatDate(user.createdAt)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border px-4 py-3">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Your role and account status are managed by WedPlan and
                  can&apos;t be changed from this page.
                </p>
              </div>
            </dl>
          </motion.aside>
        </div>

        {/* form */}
        <motion.form
          onSubmit={save}
          noValidate
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 90,
            damping: 16,
            delay: 0.1,
          }}
          className="relative rounded-4xl border border-border bg-card/90 p-6 shadow-xl backdrop-blur sm:p-8"
        >
          {/* photo */}
          <section aria-labelledby="photo-h">
            <h2 id="photo-h" className="font-serif text-xl font-semibold">
              Profile photo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a new photo to replace your current one. It is saved when
              you press Save changes.
            </p>
            <div className="mt-5 grid items-center gap-5 sm:grid-cols-[auto_1fr]">
              <div className="mx-auto w-full max-w-[16rem]">
                <ImageUpload
                  key={uploaderKey}
                  onChange={(u) => setPendingImage(u ?? undefined)}
                  onBusyChange={setUploading}
                />
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>PNG, JPG, WEBP or GIF, up to 5 MB.</p>
                {user.image && pendingImage !== null && (
                  <button
                    type="button"
                    onClick={() => setPendingImage(null)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove current photo
                  </button>
                )}
                {pendingImage === null && (
                  <p className="text-xs font-medium text-destructive">
                    Your photo will be removed when you save.
                  </p>
                )}
              </div>
            </div>
          </section>

          <hr className="my-8 border-border" />

          {/* details */}
          <section aria-labelledby="info-h" className="space-y-5">
            <h2 id="info-h" className="font-serif text-xl font-semibold">
              Personal information
            </h2>

            <Field
              id="pf-name"
              label="Full name"
              icon={User}
              error={errors.name}
            >
              <input
                id="pf-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((p) => ({ ...p, name: undefined }));
                }}
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "pf-name-msg" : undefined}
                className={input(errors.name)}
              />
            </Field>

            <Field
              id="pf-email"
              label="Email address"
              icon={Mail}
              hint="Your email is used to sign in and can't be changed here."
            >
              <div className="relative">
                <input
                  id="pf-email"
                  value={user.email}
                  readOnly
                  disabled
                  aria-describedby="pf-email-msg"
                  className={`${input()} cursor-not-allowed bg-muted/60 pr-11 text-muted-foreground`}
                />
                <Lock className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="pf-phone"
                label="Phone (optional)"
                icon={Phone}
                error={errors.phone}
              >
                <input
                  id="pf-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  placeholder="+880 1712 345678"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "pf-phone-msg" : undefined}
                  className={input(errors.phone)}
                />
              </Field>
              <Field
                id="pf-address"
                label="City / address (optional)"
                icon={Home}
                error={errors.address}
              >
                <input
                  id="pf-address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setErrors((p) => ({ ...p, address: undefined }));
                  }}
                  placeholder="e.g. Dhanmondi, Dhaka"
                  autoComplete="street-address"
                  aria-invalid={!!errors.address}
                  aria-describedby={
                    errors.address ? "pf-address-msg" : undefined
                  }
                  className={input(errors.address)}
                />
              </Field>
            </div>
          </section>

          {/* actions */}
          <div className="sticky bottom-3 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/90 p-3 shadow-lg backdrop-blur-xl">
            <p
              className="flex items-center gap-2 pl-2 text-xs font-medium text-muted-foreground"
              aria-live="polite"
            >
              <AnimatePresence mode="wait" initial={false}>
                {saved ? (
                  <motion.span
                    key="s"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-success"
                  >
                    <ShieldCheck className="h-4 w-4" /> All changes saved
                  </motion.span>
                ) : dirty ? (
                  <motion.span
                    key="d"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />{" "}
                    You have unsaved changes
                  </motion.span>
                ) : (
                  <motion.span
                    key="n"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    No changes yet
                  </motion.span>
                )}
              </AnimatePresence>
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={reset}
                disabled={!dirty || busy}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
              <motion.button
                type="submit"
                disabled={!dirty || busy || uploading}
                whileHover={dirty && !busy ? { scale: 1.04 } : undefined}
                whileTap={dirty && !busy ? { scale: 0.96 } : undefined}
                className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to) px-6 py-2.5 text-sm font-semibold text-(--logo-fg) shadow-lg shadow-brand/30 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : saved ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={3} /> Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save changes
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
