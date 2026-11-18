/**
 * Place at: lib/services-api.ts
 *
 * Data layer for the Featured Services section.
 * Works with the local json-server (db.json) today and your real Express/MongoDB API later:
 * only API_URL (and, if your API differs, the two endpoint paths below) needs to change.
 *
 * Env:  NEXT_PUBLIC_API_URL=http://localhost:5000
 */

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"
).replace(/\/$/, "");

export interface Vendor {
  id: string;
  name: string;
  businessName: string;
  image?: string | null;
  subscriptionPlan?: "free" | "premium" | string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  priceType: string;
  location: string;
  image: string;
  description?: string;
  rating: number;
  reviewCount: number;
  vendor: Vendor;
}

/* Raw shapes (what the API returns). `_id` is accepted so a MongoDB backend works unchanged. */
interface RawService {
  id?: string;
  _id?: string;
  name: string;
  category: string;
  price: number;
  priceType?: string;
  location: string;
  image: string;
  description?: string;
  status: "approved" | "pending" | "rejected" | string;
  isActive: boolean;
  vendorId: string;
  rating?: number;
  reviewCount?: number;
}

interface RawUser {
  id?: string;
  _id?: string;
  name: string;
  businessName?: string;
  image?: string | null;
  role: string;
  subscriptionPlan?: string;
  isBlocked?: boolean;
}

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

/**
 * Featured services = approved AND active services (from vendors who are not blocked),
 * best rated first, limited to `limit`.
 *
 * Filtering is requested from the API *and* re-checked here, so pending / rejected / inactive
 * services can never leak onto the homepage even if the backend ignores a query param.
 */
export async function getFeaturedServices(
  limit = 6,
  signal?: AbortSignal,
): Promise<Service[]> {
  const [services, users] = await Promise.all([
    getJSON<RawService[]>(
      "/services?status=approved&isActive=true&_sort=rating&_order=desc",
      signal,
    ),
    getJSON<RawUser[]>("/users?role=vendor", signal),
  ]);

  const vendors = new Map<string, Vendor>();
  for (const u of users) {
    if (u.isBlocked) continue;
    const id = String(u.id ?? u._id);
    vendors.set(id, {
      id,
      name: u.name,
      businessName: u.businessName || u.name,
      image: u.image,
      subscriptionPlan: u.subscriptionPlan,
    });
  }

  return services
    .filter(
      (s) =>
        s.status === "approved" &&
        s.isActive === true &&
        vendors.has(String(s.vendorId)),
    )
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit)
    .map((s) => ({
      id: String(s.id ?? s._id),
      name: s.name,
      category: s.category,
      price: s.price,
      priceType: s.priceType ?? "per event",
      location: s.location,
      image: s.image,
      description: s.description,
      rating: s.rating ?? 0,
      reviewCount: s.reviewCount ?? 0,
      vendor: vendors.get(String(s.vendorId))!,
    }));
}

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */

export interface Category {
  id: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
}

/** All categories from the API (collection: /categories). */
export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const rows = await getJSON<
    (Partial<Category> & { _id?: string; id?: string })[]
  >("/categories", signal);
  return rows.map((c) => ({
    id: String(c.id ?? c._id),
    name: c.name ?? "",
    tagline: c.tagline ?? "",
    description: c.description ?? "",
    tags: c.tags ?? [],
  }));
}

/**
 * Number of live services per category name.
 * Counts only APPROVED + ACTIVE services from vendors who are not blocked,
 * the same rule used by the Featured Services section.
 */
export async function getCategoryCounts(
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  const [services, users] = await Promise.all([
    getJSON<RawService[]>("/services?status=approved&isActive=true", signal),
    getJSON<RawUser[]>("/users?role=vendor", signal),
  ]);
  const okVendors = new Set(
    users.filter((u) => !u.isBlocked).map((u) => String(u.id ?? u._id)),
  );
  const counts: Record<string, number> = {};
  for (const s of services) {
    if (
      s.status !== "approved" ||
      s.isActive !== true ||
      !okVendors.has(String(s.vendorId))
    )
      continue;
    counts[s.category] = (counts[s.category] ?? 0) + 1;
  }
  return counts;
}

/* ------------------------------------------------------------------ */
/*  Platform stats, destinations, testimonials                         */
/* ------------------------------------------------------------------ */

async function getLiveServices(signal?: AbortSignal): Promise<RawService[]> {
  const [services, users] = await Promise.all([
    getJSON<RawService[]>("/services?status=approved&isActive=true", signal),
    getJSON<RawUser[]>("/users?role=vendor", signal),
  ]);
  const okVendors = new Set(
    users.filter((u) => !u.isBlocked).map((u) => String(u.id ?? u._id)),
  );
  return services.filter(
    (s) =>
      s.status === "approved" &&
      s.isActive === true &&
      okVendors.has(String(s.vendorId)),
  );
}

export interface PlatformStats {
  services: number;
  vendors: number;
  cities: number;
  categories: number;
}

/** Real numbers for the "Why choose WedPlan" section (live = approved + active, vendor not blocked). */
export async function getPlatformStats(
  signal?: AbortSignal,
): Promise<PlatformStats> {
  const live = await getLiveServices(signal);
  return {
    services: live.length,
    vendors: new Set(live.map((s) => String(s.vendorId))).size,
    cities: new Set(live.map((s) => s.location)).size,
    categories: new Set(live.map((s) => s.category)).size,
  };
}

/** Live service count per city (key = location name, e.g. "Cox's Bazar"). */
export async function getLocationCounts(
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  const live = await getLiveServices(signal);
  const counts: Record<string, number> = {};
  for (const s of live) counts[s.location] = (counts[s.location] ?? 0) + 1;
  return counts;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  service: string;
  rating: number;
  quote: string;
  image?: string | null;
  /** true = placeholder content. The UI shows a "Sample reviews" tag until you replace it with real reviews. */
  sample?: boolean;
}

export async function getTestimonials(
  signal?: AbortSignal,
): Promise<Testimonial[]> {
  const rows = await getJSON<
    (Partial<Testimonial> & { _id?: string; id?: string; status?: string })[]
  >("/testimonials", signal);
  return rows
    .filter((t) => (t.status ?? "approved") === "approved" && t.quote && t.name)
    .map((t) => ({
      id: String(t.id ?? t._id),
      name: t.name!,
      location: t.location ?? "",
      service: t.service ?? "",
      rating: Math.min(5, Math.max(1, t.rating ?? 5)),
      quote: t.quote!,
      image: t.image,
      sample: t.sample === true,
    }));
}

/* ------------------------------------------------------------------ */
/*  Browse Services page                                               */
/* ------------------------------------------------------------------ */

/** Every live service (approved + active, vendor not blocked), best rated first. */
export function getAllServices(signal?: AbortSignal): Promise<Service[]> {
  return getFeaturedServices(Number.MAX_SAFE_INTEGER, signal);
}
