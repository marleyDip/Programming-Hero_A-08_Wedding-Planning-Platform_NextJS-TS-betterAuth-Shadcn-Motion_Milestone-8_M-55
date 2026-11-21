"use client";

/**
 * WedPlan - Admin: Manage Services
 * Place at: components/dashboard/admin/manage-services.tsx
 * Used by: app/dashboard/admin/services/page.tsx
 *
 * Review pending services, approve / reject, change the status of published ones, search and filter,
 * and delete inappropriate services. Only approved AND switched-on services reach the public pages
 * (the public queries and the server must apply that rule too).
 */

import {
  EmptyState,
  LoadError,
  Skeleton,
  fieldCls,
  notifyServicesChanged,
  useServices,
} from "@/components/dashboard/admin/admin-shared";
import {
  Avatar,
  Modal,
  PageHeader,
  formatDate,
  money,
} from "@/components/dashboard/customer/customer-shared";
import {
  CATEGORIES,
  SERVICE_STATUS,
  ServiceStatusBadge,
  categoryMeta,
} from "@/components/dashboard/vendor/vendor-shared";
import { useTilt } from "@/components/home/section-kit";
import FancySelect, { SelectOption } from "@/components/ui/fancy-select";

import {
  ApiError,
  deleteService,
  setServiceStatus,
  type AdminService,
  type ServiceStatus,
} from "@/lib/admin-api";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownWideNarrow,
  BadgeCheck,
  Clock,
  Eye,
  Globe,
  ListFilter,
  Loader2,
  MapPin,
  Search,
  Store,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Tab = "all" | ServiceStatus;
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const SORTS: SelectOption[] = [
  { value: "new", label: "Newest first" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
];

const PAGE = 9;

const isLive = (s: AdminService) => s.status === "approved" && s.isActive;

function LiveNote({ s }: { s: AdminService }) {
  if (s.status === "pending")
    return (
      <span className="text-xs text-muted-foreground">
        Hidden until approved
      </span>
    );

  if (s.status === "rejected")
    return (
      <span className="text-xs text-muted-foreground">
        Hidden from customers
      </span>
    );

  return s.isActive ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>{" "}
      Live on the site
    </span>
  ) : (
    <span className="text-xs text-muted-foreground">
      Approved, switched off by the vendor
    </span>
  );
}

function ReviewButtons({
  s,
  onApprove,
  onReject,
  compact,
}: {
  s: AdminService;
  onApprove: () => void;
  onReject: () => void;
  compact?: boolean;
}) {
  const pad = compact ? "px-3.5 py-1.5 text-xs" : "px-5 py-2.5 text-sm";

  return (
    <>
      {s.status !== "approved" && (
        <button
          type="button"
          onClick={onApprove}
          className={`inline-flex items-center gap-1.5 rounded-full bg-success font-semibold text-white shadow-md shadow-success/30 transition hover:brightness-110 ${pad}`}
        >
          <BadgeCheck className="h-4 w-4" />{" "}
          {s.status === "rejected" ? "Approve instead" : "Approve"}
        </button>
      )}

      {s.status !== "rejected" && (
        <button
          type="button"
          onClick={onReject}
          className={`inline-flex items-center gap-1.5 rounded-full bg-destructive/10 font-semibold text-destructive transition hover:bg-destructive hover:text-white ${pad}`}
        >
          <XCircle className="h-4 w-4" />{" "}
          {s.status === "approved" ? "Revoke" : "Reject"}
        </button>
      )}
    </>
  );
}

function ServiceCard({
  s,
  index,
  onView,
  onApprove,
  onReject,
  onDelete,
}: {
  s: AdminService;
  index: number;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const { ref, reduce, style, glare, handlers } = useTilt(7, 18);
  const cat = categoryMeta(s.category);

  return (
    <motion.li
      layout
      initial={reduce ? false : { opacity: 0, y: 40, rotateX: -20 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 95,
        damping: 16,
        delay: Math.min(index, 8) * 0.045,
      }}
      className="perspective:[1100px]"
    >
      <motion.div
        ref={ref}
        {...handlers}
        style={style}
        className={`relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-md transition-shadow hover:shadow-2xl hover:shadow-brand/15 ${s.status === "pending" ? "border-gold/60" : "border-border"}`}
      >
        <div
          className="relative aspect-16/10 overflow-hidden bg-muted"
          style={{ transform: "translateZ(0)" }}
        >
          {s.images[0] ? (
            <Image
              src={s.images[0]}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-full w-full object-cover transition duration-700 hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground">
              <Store className="h-10 w-10" />
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

          <ServiceStatusBadge
            status={s.status}
            className="absolute left-3 top-3 bg-white/95! text-neutral-900! shadow-md"
          />

          <span
            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow"
            style={{
              backgroundImage: `linear-gradient(90deg, ${cat.from}, ${cat.to})`,
            }}
          >
            <cat.icon className="h-3.5 w-3.5" /> {s.category || "Uncategorised"}
          </span>
        </div>

        <motion.div
          aria-hidden
          style={{ background: glare }}
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        />

        <div
          className="relative flex flex-1 flex-col p-5"
          style={{ transform: "translateZ(20px)" }}
        >
          <h3 className="line-clamp-1 font-serif text-lg font-semibold">
            {s.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />{" "}
            <span className="truncate">{s.location || "No location"}</span>
          </p>

          <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-muted/50 p-2.5">
            <Avatar
              src={s.vendor?.image}
              name={s.vendor?.name ?? "?"}
              size={32}
            />

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">
                {s.vendor?.businessName || s.vendor?.name || "Unknown vendor"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {s.vendor?.email || "Vendor account not found"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <p className="font-serif text-lg font-semibold text-brand">
              {money(s.price)}{" "}
              <span className="font-sans text-[11px] font-medium text-muted-foreground">
                {s.priceType}
              </span>
            </p>
            <LiveNote s={s} />
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
            <ReviewButtons
              s={s}
              onApprove={onApprove}
              onReject={onReject}
              compact
            />

            <span className="ml-auto flex gap-1.5">
              <button
                type="button"
                onClick={onView}
                aria-label={`View ${s.name}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-border hover:border-brand/50 hover:bg-brand-soft"
              >
                <Eye className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onDelete}
                aria-label={`Delete ${s.name}`}
                className="grid h-8 w-8 place-items-center rounded-full border border-border text-destructive hover:bg-destructive hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </span>
          </div>
        </div>
      </motion.div>
    </motion.li>
  );
}

function DetailsDialog({
  s,
  onClose,
  onApprove,
  onReject,
}: {
  s: AdminService | null;
  onClose: () => void;
  onApprove: (s: AdminService) => void;
  onReject: (s: AdminService) => void;
}) {
  const [i, setI] = useState(0);
  const [lastId, setLastId] = useState<string | null>(null);
  if (s && s.id !== lastId) {
    setLastId(s.id);
    setI(0);
  }
  const st = s ? SERVICE_STATUS[s.status] : null;

  return (
    <Modal open={!!s} onClose={onClose} label="Service review" wide>
      {s && st && (
        <div>
          <div className="relative aspect-16/8 overflow-hidden bg-muted perspective:[900px]">
            <AnimatePresence mode="popLayout" initial={false}>
              {s.images[i] && (
                <motion.img
                  key={s.images[i]}
                  src={s.images[i]}
                  alt=""
                  initial={{ opacity: 0, rotateY: 20 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </AnimatePresence>

            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />

            <div className="absolute inset-x-6 bottom-4 flex items-end justify-between gap-3 text-white">
              <h2 className="truncate font-serif text-2xl font-semibold">
                {s.name}
              </h2>
              <ServiceStatusBadge
                status={s.status}
                className="shrink-0 bg-white/95! !text-neutral-900!"
              />
            </div>
          </div>

          {s.images.length > 1 && (
            <div className="flex gap-2 px-6 pt-4 sm:px-8">
              {s.images.map((u, k) => (
                <button
                  key={u}
                  type="button"
                  aria-label={`Photo ${k + 1}`}
                  onClick={() => setI(k)}
                  className={`relative h-14 w-20 overflow-hidden rounded-xl ring-2 transition ${k === i ? "ring-brand" : "opacity-60 ring-transparent hover:opacity-100"}`}
                >
                  <Image
                    src={u}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4 p-6 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Category", s.category || "—"],
                ["Location", s.location || "—"],
                ["Price", `${money(s.price)} ${s.priceType}`],
                ["Submitted", formatDate(s.createdAt)],
                [
                  "Vendor availability",
                  s.isActive ? "Switched on" : "Switched off",
                ],
                [
                  "Public visibility",
                  isLive(s) ? "Visible to customers" : "Hidden",
                ],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-muted/50 p-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {k}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">{v}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border p-3.5">
              <Avatar
                src={s.vendor?.image}
                name={s.vendor?.name ?? "?"}
                size={44}
              />

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Vendor
                </p>
                <p className="truncate text-sm font-semibold">
                  {s.vendor?.businessName || s.vendor?.name || "Unknown vendor"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.vendor?.name}
                  {s.vendor?.email ? ` · ${s.vendor.email}` : ""}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">Description</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {s.description || "No description."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4 sm:px-8">
            {isLive(s) && (
              <Link
                href={`/services/${s.id}`}
                className="mr-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-accent"
              >
                <Globe className="h-4 w-4" /> View public page
              </Link>
            )}

            <ReviewButtons
              s={s}
              onApprove={() => onApprove(s)}
              onReject={() => onReject(s)}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function ManageServices() {
  const { services, setServices, error, reload } = useServices();

  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState("new");
  const [shown, setShown] = useState(PAGE);
  const [viewing, setViewing] = useState<AdminService | null>(null);
  const [rejecting, setRejecting] = useState<AdminService | null>(null);
  const [deleting, setDeleting] = useState<AdminService | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const c = {
      all: services?.length ?? 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    services?.forEach((s) => c[s.status]++);

    return c;
  }, [services]);

  const categories = useMemo(() => {
    const extra = [
      ...new Set(
        (services ?? [])
          .map((s) => s.category)
          .filter((c) => c && !CATEGORIES.some((k) => k.name === c)),
      ),
    ];

    return [...CATEGORIES.map((c) => c.name), ...extra];
  }, [services]);

  const categoryOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((category) => ({
        value: category,
        label: category,
      })),
    ],
    [categories],
  );

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();

    const rows = (services ?? []).filter(
      (s) =>
        (tab === "all" || s.status === tab) &&
        (!cat || s.category === cat) &&
        (!term ||
          s.name.toLowerCase().includes(term) ||
          (s.vendor?.name ?? "").toLowerCase().includes(term) ||
          (s.vendor?.businessName ?? "").toLowerCase().includes(term)),
    );

    if (sort === "low") rows.sort((a, b) => a.price - b.price);
    else if (sort === "high") rows.sort((a, b) => b.price - a.price);

    return rows;
  }, [services, tab, q, cat, sort]);

  const visible = list.slice(0, shown);

  /** Optimistic status change with rollback. When `undoable`, the success toast offers an Undo. */
  const changeStatus = async (
    s: AdminService,
    status: ServiceStatus,
    undoable = true,
  ) => {
    const prev = s.status;

    const patch = (st: ServiceStatus) => {
      setServices(
        (rows) =>
          rows?.map((r) => (r.id === s.id ? { ...r, status: st } : r)) ?? rows,
      );

      setViewing((v) => (v && v.id === s.id ? { ...v, status: st } : v));
    };
    patch(status);

    try {
      await setServiceStatus(s.id, status);
      notifyServicesChanged();

      toast.success(
        status === "approved"
          ? `"${s.name}" approved`
          : status === "rejected"
            ? `"${s.name}" rejected`
            : `"${s.name}" moved to pending`,
        {
          description:
            status === "approved"
              ? s.isActive
                ? "It is now visible to customers."
                : "It will show once the vendor switches it on."
              : "It is hidden from customers.",

          action:
            undoable && prev !== status
              ? {
                  label: "Undo",
                  onClick: () =>
                    void changeStatus({ ...s, status }, prev, false),
                }
              : undefined,
        },
      );
    } catch (e) {
      patch(prev);

      toast.error("Couldn't update this service", {
        description:
          e instanceof ApiError && (e.status === 401 || e.status === 403)
            ? "You don't have permission to do that."
            : e instanceof ApiError && e.status === 404
              ? "This service no longer exists."
              : "Please try again in a moment.",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);

    try {
      await deleteService(deleting.id);

      setServices((rows) => rows?.filter((r) => r.id !== deleting.id) ?? rows);
      setViewing((v) => (v?.id === deleting.id ? null : v));
      notifyServicesChanged();
      toast.success(`"${deleting.name}" deleted`);
      setDeleting(null);
    } catch (e) {
      toast.error("Couldn't delete this service", {
        description:
          e instanceof ApiError && e.status === 404
            ? "It was already removed."
            : "Please try again in a moment.",
      });

      if (e instanceof ApiError && e.status === 404) {
        setServices(
          (rows) => rows?.filter((r) => r.id !== deleting.id) ?? rows,
        );
        setDeleting(null);
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;

    const s = rejecting;
    setRejecting(null);
    setViewing(null);
    await changeStatus(s, "rejected");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Manage Services"
        subtitle="Review what vendors submit. Only approved services that the vendor has switched on are shown to customers."
      />

      {services && counts.pending > 0 && tab !== "pending" && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            setTab("pending");
            setShown(PAGE);
          }}
          className="mb-5 flex w-full items-center gap-3 rounded-3xl border border-gold/50 bg-gold/15 p-4 text-left transition hover:bg-gold/25"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold/40">
            <Clock className="h-5 w-5" />
          </span>

          <span className="text-sm">
            <b>
              {counts.pending}{" "}
              {counts.pending === 1 ? "service is" : "services are"} waiting for
              review.
            </b>{" "}
            <span className="text-muted-foreground">
              Tap to review them now.
            </span>
          </span>
        </motion.button>
      )}

      <div className="mb-6 space-y-4">
        <div
          role="tablist"
          aria-label="Filter by status"
          className="flex gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1.5 scrollbar-none sm:inline-flex"
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
                    layoutId="adm-svc-tab"
                    className="absolute inset-0 rounded-full bg-linear-to-r from-(--logo-from) to-brand shadow-md shadow-brand/30"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}

                <span className="relative">
                  {t.label}{" "}
                  <span className="ml-1 text-xs opacity-80">
                    {services ? counts[t.key] : "–"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* <div className="grid gap-3 md:grid-cols-[1fr_14rem_13rem]"> */}

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_13rem]">
          {/* Search */}
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setShown(PAGE);
              }}
              placeholder="Search by service or vendor"
              aria-label="Search services"
              className={`${fieldCls()} h-14! w-full rounded-full! py-0! pl-11 pr-10`}
            />

            {q && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQ("");
                  setShown(PAGE);
                }}
                className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category */}
          <FancySelect
            value={cat}
            onChange={(value) => {
              setCat(value);
              setShown(PAGE);
            }}
            options={categoryOptions}
            icon={ListFilter}
            className="w-full"
          />

          {/* <select
            value={cat}
            onChange={(e) => {
              setCat(e.target.value);
              setShown(PAGE);
            }}
            aria-label="Filter by category"
            className={`${fieldCls()} rounded-full! py-3!`}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select> */}

          {/* Sort */}
          <FancySelect
            value={sort}
            onChange={(value) => {
              setSort(value);
              setShown(PAGE);
            }}
            // onChange={setSort}
            options={SORTS}
            icon={ArrowDownWideNarrow}
            className="w-full"
          />

          {/* <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort services"
            className={`${fieldCls()} rounded-full! py-3!`}
          >
            {SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select> */}
        </div>
      </div>

      {error ? (
        <LoadError message={error} onRetry={reload} />
      ) : !services ? (
        <div
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
          role="status"
          aria-label="Loading services"
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No services found"
          text={
            services.length === 0
              ? "Vendors haven't submitted any services yet."
              : "Nothing matches these filters."
          }
        >
          {(q || cat || tab !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setCat("");
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
              {visible.map((s, i) => (
                <ServiceCard
                  key={s.id}
                  s={s}
                  index={i}
                  onView={() => setViewing(s)}
                  onApprove={() => changeStatus(s, "approved")}
                  onReject={() => setRejecting(s)}
                  onDelete={() => setDeleting(s)}
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
        s={viewing}
        onClose={() => setViewing(null)}
        onApprove={(s) => changeStatus(s, "approved")}
        onReject={(s) => setRejecting(s)}
      />

      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        label="Reject service"
      >
        {rejecting && (
          <div className="p-7 text-center sm:p-9">
            <motion.span
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive"
            >
              <XCircle className="h-8 w-8" />
            </motion.span>

            <h2 className="mt-5 font-serif text-2xl font-semibold">
              {rejecting.status === "approved"
                ? "Revoke approval?"
                : "Reject this service?"}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <b className="text-foreground">{rejecting.name}</b> will be hidden
              from customers. The vendor will see it as rejected. You can
              approve it again later.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setRejecting(null)}
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmReject}
                className="rounded-full bg-destructive px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-destructive/30"
              >
                {rejecting.status === "approved"
                  ? "Yes, revoke"
                  : "Yes, reject"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        label="Delete service"
        busy={busy}
      >
        {deleting && (
          <div className="p-7 text-center sm:p-9">
            <motion.span
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive"
            >
              <Trash2 className="h-8 w-8" />
            </motion.span>

            <h2 className="mt-5 font-serif text-2xl font-semibold">
              Delete this service?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <b className="text-foreground">{deleting.name}</b> will be removed
              permanently. This can&apos;t be undone. If you only want to hide
              it, reject it instead.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={busy}
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-accent disabled:opacity-50"
              >
                Keep it
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-destructive/30 disabled:opacity-80"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                  </>
                ) : (
                  "Yes, delete"
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
