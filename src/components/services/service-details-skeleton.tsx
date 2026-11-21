function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

export default function ServiceDetailsSkeleton() {
  return (
    <div
      className="relative isolate overflow-hidden pb-28 pt-8 lg:pb-24"
      aria-busy="true"
      aria-label="Loading service details"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-4 w-10" />
          <SkeletonBlock className="h-3 w-3 rounded-full" />
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-3 w-3 rounded-full" />
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-3 w-3 rounded-full" />
          <SkeletonBlock className="h-4 w-28" />
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
          {/* Left column */}
          <div className="min-w-0 space-y-12">
            {/* Gallery */}
            <div>
              <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-muted">
                <SkeletonBlock className="absolute inset-0 rounded-3xl" />

                {/* Category badge */}
                <SkeletonBlock className="absolute left-5 top-5 h-9 w-44 rounded-full" />

                {/* Expand button */}
                <SkeletonBlock className="absolute right-5 top-5 h-11 w-11 rounded-full" />

                {/* Image counter */}
                <SkeletonBlock className="absolute bottom-5 left-5 h-7 w-14 rounded-full" />

                {/* Gallery navigation */}
                <div className="absolute bottom-5 right-5 flex gap-2">
                  <SkeletonBlock className="h-11 w-11 rounded-full" />
                  <SkeletonBlock className="h-11 w-11 rounded-full" />
                </div>
              </div>

              {/* Thumbnails */}
              <div className="mt-4 grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonBlock key={i} className="aspect-4/3 rounded-2xl" />
                ))}
              </div>
            </div>

            {/* About this service */}
            <section>
              <SkeletonBlock className="h-8 w-64 rounded-lg" />

              <div className="mt-4 space-y-2.5">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-[94%]" />
                <SkeletonBlock className="h-4 w-[82%]" />
                <SkeletonBlock className="h-4 w-[65%]" />
              </div>
            </section>

            {/* Service snapshot */}
            <section>
              <SkeletonBlock className="h-8 w-56 rounded-lg" />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3.5 rounded-2xl border border-border bg-card/90 p-4 shadow-sm"
                  >
                    <SkeletonBlock className="h-11 w-11 shrink-0 rounded-xl" />

                    <div className="min-w-0 flex-1 space-y-2">
                      <SkeletonBlock className="h-3 w-20" />
                      <SkeletonBlock className="h-4 w-32 max-w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* How booking works */}
            <section>
              <SkeletonBlock className="h-8 w-60 rounded-lg" />

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative rounded-2xl border border-border bg-card/90 p-5"
                  >
                    <SkeletonBlock className="absolute -top-3 left-5 h-6 w-6 rounded-full" />

                    <SkeletonBlock className="h-6 w-6 rounded-md" />

                    <SkeletonBlock className="mt-3 h-4 w-28 max-w-full" />

                    <div className="mt-2 space-y-2">
                      <SkeletonBlock className="h-3 w-full" />
                      <SkeletonBlock className="h-3 w-[85%]" />
                      <SkeletonBlock className="h-3 w-[65%]" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column */}
          <aside className="min-w-0">
            <div className="space-y-5 lg:sticky lg:top-24">
              {/* Service information card */}
              <div className="relative overflow-hidden rounded-4xl border border-border bg-card p-6 shadow-2xl shadow-brand/10 sm:p-8">
                {/* Category and share */}
                <div className="flex items-center justify-between gap-3">
                  <SkeletonBlock className="h-8 w-40 rounded-full" />
                  <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
                </div>

                {/* Service title */}
                <div className="relative mt-5 space-y-2">
                  <SkeletonBlock className="h-9 w-full" />
                  <SkeletonBlock className="h-9 w-[75%]" />
                </div>

                {/* Rating and location */}
                <div className="mt-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <SkeletonBlock className="h-4 w-24" />
                    <SkeletonBlock className="h-4 w-8" />
                    <SkeletonBlock className="h-4 w-20" />
                  </div>

                  <SkeletonBlock className="h-4 w-36" />
                </div>

                {/* Starting price */}
                <div className="mt-6 rounded-2xl bg-brand-soft/70 p-5">
                  <SkeletonBlock className="h-3 w-28" />

                  <div className="mt-2 flex items-baseline gap-3">
                    <SkeletonBlock className="h-10 w-36" />
                    <SkeletonBlock className="h-4 w-16" />
                  </div>
                </div>

                {/* Booking button */}
                <SkeletonBlock className="mt-6 h-14 w-full rounded-full" />
              </div>

              {/* Vendor card */}
              <div className="rounded-4xl border border-border bg-card p-6 shadow-lg">
                <SkeletonBlock className="h-3 w-24" />

                <div className="mt-4 flex items-center gap-4">
                  {/* Vendor avatar */}
                  <SkeletonBlock className="h-16 w-16 shrink-0 rounded-full" />

                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBlock className="h-5 w-40 max-w-full" />
                    <SkeletonBlock className="h-4 w-28 max-w-full" />
                    <SkeletonBlock className="h-6 w-32 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Similar services */}
        <section className="mt-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <SkeletonBlock className="h-8 w-64 max-w-[65%] rounded-lg" />
            <SkeletonBlock className="h-4 w-16" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg"
              >
                <SkeletonBlock className="aspect-16/10 rounded-none" />

                <div className="p-4">
                  <SkeletonBlock className="h-5 w-3/4" />

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <SkeletonBlock className="h-3 w-28" />
                    <SkeletonBlock className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Mobile sticky booking bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 p-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div className="min-w-0 space-y-2">
            <SkeletonBlock className="h-5 w-24" />
            <SkeletonBlock className="h-3 w-16" />
          </div>

          <SkeletonBlock className="h-12 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}
