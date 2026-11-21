// Reusable skeleton block
function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-muted ${className}`}
    />
  );
}

// Customer dashboard overview skeleton
export function CustomerOverviewSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
      {/* Welcome hero */}
      <section className="relative isolate overflow-hidden rounded-4xl bg-linear-to-br from-(--logo-from) via-brand to-[oklch(0.42_0.17_330)] p-7 text-white shadow-2xl shadow-brand/30 sm:p-10">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.5)_1px,transparent_1px)] bg-size-[22px_22px] opacity-25" />

        <div className="relative max-w-xl">
          <SkeletonBlock className="h-3 w-28 bg-white/25" />
          <SkeletonBlock className="mt-4 h-10 w-64 max-w-full rounded-lg bg-white/25 sm:h-12 sm:w-96" />

          <div className="mt-4 space-y-2">
            <SkeletonBlock className="h-4 w-full max-w-md bg-white/20" />
            <SkeletonBlock className="h-4 w-3/4 max-w-sm bg-white/20" />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <SkeletonBlock className="h-12 w-40 rounded-full bg-white/90" />
            <SkeletonBlock className="h-12 w-36 rounded-full border border-white/30 bg-white/15" />
          </div>
        </div>

        {/* Floating decorative shapes */}
        <SkeletonBlock className="absolute -right-5 -top-5 hidden h-44 w-44 rounded-full bg-white/10 sm:block" />
        <SkeletonBlock className="absolute bottom-8 right-12 hidden h-14 w-14 rounded-2xl bg-white/15 sm:block" />
        <SkeletonBlock className="absolute right-28 top-10 hidden h-12 w-12 rounded-2xl bg-white/15 sm:block" />
      </section>

      {/* Statistics */}
      <ul className="grid grid-cols-2 gap-4 perspective-[1400px] lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i}>
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-lg">
              <div className="flex items-start justify-between">
                <SkeletonBlock className="h-12 w-12 rounded-2xl" />
                <SkeletonBlock className="h-4 w-4 rounded" />
              </div>

              <SkeletonBlock className="mt-5 h-10 w-16 rounded-lg" />
              <SkeletonBlock className="mt-2 h-3 w-28 max-w-full" />

              <SkeletonBlock className="mt-4 h-1.5 w-full rounded-full" />
            </div>
          </li>
        ))}
      </ul>

      {/* Status and next event */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Requests by status */}
        <section className="rounded-3xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur">
          <div className="mb-5">
            <SkeletonBlock className="h-6 w-44 rounded-lg" />
            <SkeletonBlock className="mt-2 h-3 w-56 max-w-full" />
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row">
            {/* Donut chart */}
            <div className="relative h-44 w-44 shrink-0 rounded-full border-18 border-muted">
              <div className="absolute inset-0 grid place-items-center">
                <div className="flex flex-col items-center gap-2">
                  <SkeletonBlock className="h-8 w-12 rounded-lg" />
                  <SkeletonBlock className="h-2.5 w-14" />
                </div>
              </div>
            </div>

            {/* Status legend */}
            <ul className="grid w-full gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2"
                >
                  <SkeletonBlock className="h-3 w-3 rounded-full" />
                  <SkeletonBlock className="h-3 flex-1 max-w-28" />
                  <SkeletonBlock className="h-3 w-6" />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Next event */}
        <section className="rounded-3xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur">
          <div className="mb-5">
            <SkeletonBlock className="h-6 w-28 rounded-lg" />
            <SkeletonBlock className="mt-2 h-3 w-52 max-w-full" />
          </div>

          <div className="flex h-full flex-col">
            <div className="flex items-center gap-5">
              {/* Countdown */}
              <SkeletonBlock className="h-24 w-24 shrink-0 rounded-3xl" />

              {/* Event date and location */}
              <div className="min-w-0 flex-1 space-y-3">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-7 w-36 max-w-full rounded-lg" />
                <SkeletonBlock className="h-3 w-32 max-w-full" />
              </div>
            </div>

            {/* Vendor and service */}
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
              <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />

              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-32 max-w-full" />
                <SkeletonBlock className="h-3 w-24 max-w-full" />
              </div>

              <SkeletonBlock className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </section>
      </div>

      {/* Recent requests */}
      <section className="rounded-3xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <SkeletonBlock className="h-6 w-40 rounded-lg" />
            <SkeletonBlock className="mt-2 h-3 w-52 max-w-full" />
          </div>

          <SkeletonBlock className="h-4 w-16" />
        </div>

        <ul className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
            >
              {/* Service image */}
              <SkeletonBlock className="h-14 w-14 shrink-0 rounded-2xl" />

              {/* Service and vendor information */}
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-40 max-w-full" />
                <SkeletonBlock className="h-3 w-52 max-w-full" />
              </div>

              {/* Booking status */}
              <SkeletonBlock className="h-6 w-20 shrink-0 rounded-full" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
