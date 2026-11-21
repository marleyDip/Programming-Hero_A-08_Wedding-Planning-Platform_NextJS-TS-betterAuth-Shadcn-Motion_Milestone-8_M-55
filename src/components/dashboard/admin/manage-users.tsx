"use client";

/**
 * WedPlan - Admin: Manage Users
 * Place at: components/dashboard/admin/manage-users.tsx
 * Used by: app/dashboard/admin/users/page.tsx
 *
 * Search by name or email, filter by role, view details, block / unblock.
 * Admin accounts and your own account can't be blocked. The server must enforce this too, and must make
 * blocked users lose access to every protected API (not just the UI).
 */

import {
  Avatar,
  Modal,
  PageHeader,
  formatDate,
} from "@/components/dashboard/customer/customer-shared";
import { useTilt } from "@/components/home/section-kit";
import {
  ApiError,
  setUserBlocked,
  type AdminUser,
  type Role,
} from "@/lib/admin-api";
import { AnimatePresence, motion } from "framer-motion";
import {
  Ban,
  Building2,
  CalendarDays,
  Crown,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Unlock,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BlockedBadge,
  EmptyState,
  LoadError,
  ROLE_META,
  RoleBadge,
  Skeleton,
  fieldCls,
  useAdminUser,
  useServices,
  useUsers,
} from "./admin-shared";

const PAGE = 12;
const TABS: { key: "all" | Role; label: string }[] = [
  { key: "all", label: "All" },
  { key: "customer", label: "Customers" },
  { key: "vendor", label: "Vendors" },
  { key: "admin", label: "Admins" },
];
const premiumNow = (u: AdminUser) =>
  u.subscriptionPlan === "premium" &&
  (!u.subscriptionExpiresAt || new Date(u.subscriptionExpiresAt) > new Date());

function UserCard({
  u,
  index,
  me,
  onView,
  onToggle,
}: {
  u: AdminUser;
  index: number;
  me: boolean;
  onView: () => void;
  onToggle: () => void;
}) {
  const { ref, reduce, style, glare, handlers } = useTilt(6, 16);
  const locked = u.role === "admin" || me;

  return (
    <motion.li
      layout
      initial={reduce ? false : { opacity: 0, y: 36, rotateX: -18 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 16,
        delay: Math.min(index, 8) * 0.04,
      }}
      className="perspective-[1000px]"
    >
      <motion.div
        ref={ref}
        {...handlers}
        style={style}
        className={`relative h-full overflow-hidden rounded-3xl border bg-card p-5 shadow-md transition-shadow hover:shadow-2xl hover:shadow-brand/15 ${u.isBlocked ? "border-destructive/40" : "border-border"}`}
      >
        <motion.div
          aria-hidden
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        />

        <div
          className="relative flex items-start gap-3.5"
          style={{ transform: "translateZ(24px)" }}
        >
          <span className="relative shrink-0">
            <Avatar
              src={u.image}
              name={u.name}
              size={52}
              className={u.isBlocked ? "grayscale" : ""}
            />

            {u.role === "vendor" && premiumNow(u) && (
              <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-linear-to-br from-[oklch(0.88_0.14_85)] to-[oklch(0.7_0.16_55)] text-neutral-900 ring-2 ring-card">
                <Crown className="h-3.5 w-3.5" />
              </span>
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">
              {u.name}{" "}
              {me && (
                <span className="text-xs font-medium text-muted-foreground">
                  (you)
                </span>
              )}
            </p>

            <p className="truncate text-xs text-muted-foreground">{u.email}</p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <RoleBadge role={u.role} />
              <BlockedBadge blocked={u.isBlocked} />
            </div>
          </div>
        </div>

        <div
          className="relative mt-4 flex items-center justify-between gap-2 border-t border-border pt-3.5"
          style={{ transform: "translateZ(16px)" }}
        >
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> Joined{" "}
            {formatDate(u.createdAt)}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onView}
              className="rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold hover:border-brand/50 hover:bg-brand-soft"
            >
              Details
            </button>

            <button
              type="button"
              onClick={onToggle}
              disabled={locked}
              title={
                u.role === "admin"
                  ? "Admin accounts can't be blocked"
                  : me
                    ? "You can't block yourself"
                    : undefined
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${u.isBlocked ? "bg-success text-white shadow-md shadow-success/30" : "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"}`}
            >
              {u.isBlocked ? (
                <>
                  <Unlock className="h-3.5 w-3.5" /> Unblock
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5" /> Block
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.li>
  );
}

function DetailsDialog({
  u,
  serviceCount,
  onClose,
  onToggle,
  me,
}: {
  u: AdminUser | null;
  serviceCount: number | null;
  onClose: () => void;
  onToggle: (u: AdminUser) => void;
  me: boolean;
}) {
  const locked = !!u && (u.role === "admin" || me);

  return (
    <Modal open={!!u} onClose={onClose} label="User details">
      {u && (
        <div>
          <div
            className="relative overflow-hidden bg-linear-to-br px-6 pb-6 pt-8 text-white sm:px-8"
            style={{
              backgroundImage: `linear-gradient(135deg, ${ROLE_META[u.role].from}, ${ROLE_META[u.role].to})`,
            }}
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[20px_20px]" />

            <div className="relative flex items-center gap-4">
              <Avatar
                src={u.image}
                name={u.name}
                size={72}
                className="ring-4 ring-white/40"
              />

              <div className="min-w-0">
                <h2 className="truncate font-serif text-2xl font-semibold">
                  {u.name}
                </h2>

                <p className="truncate text-sm text-white/80">{u.email}</p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <RoleBadge
                    role={u.role}
                    className="bg-white/95! !text-neutral-900!"
                  />

                  <BlockedBadge
                    blocked={u.isBlocked}
                    className="bg-white/95!"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  [Mail, "Email", u.email || "—"],
                  [Phone, "Phone", u.phone || "Not provided"],
                  [CalendarDays, "Joined", formatDate(u.createdAt)],
                  [
                    ShieldCheck,
                    "Account status",
                    u.isBlocked ? "Blocked" : "Active",
                  ],
                  ...(u.role === "vendor"
                    ? ([
                        [
                          Building2,
                          "Business",
                          u.businessName || "Not provided",
                        ],
                        [
                          Crown,
                          "Plan",
                          premiumNow(u)
                            ? `Premium${u.subscriptionExpiresAt ? ` until ${formatDate(u.subscriptionExpiresAt)}` : ""}`
                            : "Free",
                        ],
                        [
                          Users,
                          "Services submitted",
                          serviceCount === null ? "…" : String(serviceCount),
                        ],
                      ] as const)
                    : []),
                ] as const
              ).map(([I, k, v]) => (
                <div
                  key={k}
                  className="flex items-start gap-3 rounded-2xl bg-muted/50 p-3.5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-brand shadow-sm">
                    <I className="h-4 w-4" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {k}
                    </p>
                    <p className="wrap-break-word text-sm font-semibold">{v}</p>
                  </div>
                </div>
              ))}
            </div>

            {u.role === "admin" && (
              <p className="rounded-2xl bg-muted/60 p-3.5 text-sm text-muted-foreground">
                Admin accounts are assigned securely and can&apos;t be blocked
                from here.
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-accent"
            >
              Close
            </button>

            {!locked && (
              <button
                type="button"
                onClick={() => onToggle(u)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold ${u.isBlocked ? "bg-success text-white" : "bg-destructive text-white"}`}
              >
                {u.isBlocked ? (
                  <>
                    <Unlock className="h-4 w-4" /> Unblock user
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" /> Block user
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function ManageUsers() {
  const { user: admin } = useAdminUser();

  const { users, setUsers, error, reload } = useUsers();
  const { services } = useServices();
  const [tab, setTab] = useState<"all" | Role>("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [viewing, setViewing] = useState<AdminUser | null>(null);
  const [confirm, setConfirm] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: users?.length ?? 0,
      customer: 0,
      vendor: 0,
      admin: 0,
    };

    users?.forEach((u) => c[u.role]++);
    return c;
  }, [users]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();

    return (users ?? []).filter(
      (u) =>
        (tab === "all" || u.role === tab) &&
        (!term ||
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)),
    );
  }, [users, tab, q]);

  const serviceCount =
    viewing && services
      ? services.filter((s) => s.vendorId === viewing.id).length
      : null;
  const visible = list.slice(0, shown);

  const apply = async (target: AdminUser) => {
    if (!admin) return;
    const next = !target.isBlocked;
    setBusy(true);

    try {
      await setUserBlocked(target, next, admin.id);

      setUsers(
        (prev) =>
          prev?.map((u) =>
            u.id === target.id ? { ...u, isBlocked: next } : u,
          ) ?? prev,
      );

      setViewing((v) =>
        v && v.id === target.id ? { ...v, isBlocked: next } : v,
      );

      toast.success(
        next ? `${target.name} was blocked` : `${target.name} was unblocked`,
        {
          description: next
            ? "They can no longer use protected features."
            : "Their access has been restored.",
        },
      );
      setConfirm(null);
    } catch (e) {
      toast.error(
        next ? "Couldn't block this user" : "Couldn't unblock this user",
        {
          description:
            e instanceof ApiError && (e.status === 403 || e.status === 401)
              ? e.message
              : "Please try again in a moment.",
        },
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Manage Users"
        subtitle="Search everyone on WedPlan, check their details and block accounts that break the rules."
      />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Filter by role"
          className="flex gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1.5 scrollbar-none"
        >
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={on}
                type="button"
                onClick={() => {
                  setTab(t.key);
                  setShown(PAGE);
                }}
                className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${on ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                {on && (
                  <motion.span
                    layoutId="usr-tab"
                    className="absolute inset-0 rounded-full bg-linear-to-r from-(--logo-from) to-brand shadow-md shadow-brand/30"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}

                <span className="relative">
                  {t.label}{" "}
                  <span className="ml-1 text-xs opacity-80">
                    {users ? counts[t.key] : "–"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Search by name or email"
            aria-label="Search users"
            className={`${fieldCls()} rounded-full! py-3! pl-11 pr-10`}
          />

          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error ? (
        <LoadError message={error} onRetry={reload} />
      ) : !users ? (
        <div
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          role="status"
          aria-label="Loading users"
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          text={
            q
              ? `Nobody matches "${q}" in this filter.`
              : "There are no users in this filter yet."
          }
        >
          {(q || tab !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setTab("all");
              }}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground"
            >
              Clear filters
            </button>
          )}
        </EmptyState>
      ) : (
        <>
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((u, i) => (
                <UserCard
                  key={u.id}
                  u={u}
                  index={i}
                  me={u.id === admin?.id}
                  onView={() => setViewing(u)}
                  onToggle={() => (u.isBlocked ? apply(u) : setConfirm(u))}
                />
              ))}
            </AnimatePresence>
          </ul>
          <p
            className="mt-6 text-center text-xs text-muted-foreground"
            aria-live="polite"
          >
            Showing {visible.length} of {list.length}
          </p>

          {list.length > shown && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShown((n) => n + PAGE)}
                className="rounded-full border border-border bg-card px-7 py-3 text-sm font-semibold hover:border-brand/50 hover:bg-brand-soft"
              >
                Show more
              </button>
            </div>
          )}
        </>
      )}

      <DetailsDialog
        u={viewing}
        serviceCount={serviceCount}
        onClose={() => setViewing(null)}
        me={viewing?.id === admin?.id}
        onToggle={(u) =>
          u.isBlocked ? apply(u) : (setViewing(null), setConfirm(u))
        }
      />

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        label="Block user"
        busy={busy}
      >
        {confirm && (
          <div className="p-7 text-center sm:p-9">
            <motion.span
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive"
            >
              <Ban className="h-8 w-8" />
            </motion.span>

            <h2 className="mt-5 font-serif text-2xl font-semibold">
              Block this user?
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <b className="text-foreground">{confirm.name}</b> will lose access
              to protected features such as their dashboard. You can unblock
              them any time.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={busy}
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => apply(confirm)}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-destructive/30 disabled:opacity-80"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Blocking…
                  </>
                ) : (
                  "Yes, block"
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
