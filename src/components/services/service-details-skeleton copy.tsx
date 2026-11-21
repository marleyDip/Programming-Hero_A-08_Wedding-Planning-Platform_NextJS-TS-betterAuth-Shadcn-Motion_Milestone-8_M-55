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
        <div className="mb-8 flex items-center gap-2">
          <SkeletonBlock className="h-4 w-12" />
          <SkeletonBlock className="h-3 w-3 rounded-full" />
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-3 w-3 rounded-full" />
          <SkeletonBlock className="h-4 w-28" />
        </div>

        {/* Main content */}
        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
          {/* Left column */}
          <div className="min-w-0 space-y-12">
            {/* Image gallery */}
            <div>
              <SkeletonBlock className="aspect-4/3 w-full rounded-3xl" />

              <div className="mt-4 grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonBlock key={i} className="aspect-4/3 rounded-2xl" />
                ))}
              </div>
            </div>

            {/* About service */}
            <section>
              <SkeletonBlock className="h-7 w-48" />

              <div className="mt-5 space-y-3">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-11/12" />
                <SkeletonBlock className="h-4 w-4/5" />
              </div>
            </section>

            {/* Service snapshot */}
            <section>
              <SkeletonBlock className="h-7 w-52" />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3.5 rounded-2xl border border-border bg-card/90 p-4"
                  >
                    <SkeletonBlock className="h-11 w-11 shrink-0 rounded-xl" />

                    <div className="min-w-0 flex-1 space-y-2">
                      <SkeletonBlock className="h-3 w-20" />
                      <SkeletonBlock className="h-4 w-28 max-w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* How booking works */}
            <section>
              <SkeletonBlock className="h-7 w-56" />

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border bg-card/90 p-5"
                  >
                    <SkeletonBlock className="h-6 w-6 rounded-full" />
                    <SkeletonBlock className="mt-4 h-6 w-6 rounded-lg" />
                    <SkeletonBlock className="mt-4 h-4 w-28" />
                    <SkeletonBlock className="mt-2 h-3 w-full" />
                    <SkeletonBlock className="mt-2 h-3 w-4/5" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column */}
          <aside className="min-w-0">
            <div className="space-y-5 lg:sticky lg:top-24">
              {/* Service information card */}
              <div className="rounded-4xl border border-border bg-card p-6 shadow-lg sm:p-8">
                {/* Category and share */}
                <div className="flex items-center justify-between gap-3">
                  <SkeletonBlock className="h-8 w-36 rounded-full" />
                  <SkeletonBlock className="h-10 w-10 rounded-full" />
                </div>

                {/* Service title */}
                <SkeletonBlock className="mt-6 h-9 w-full" />
                <SkeletonBlock className="mt-2 h-9 w-3/4" />

                {/* Rating and location */}
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <SkeletonBlock className="h-4 w-36" />
                  <SkeletonBlock className="h-4 w-32" />
                </div>

                {/* Price */}
                <div className="mt-6 rounded-2xl bg-brand-soft/50 p-5">
                  <SkeletonBlock className="h-3 w-28" />
                  <div className="mt-3 flex items-baseline gap-3">
                    <SkeletonBlock className="h-10 w-36" />
                    <SkeletonBlock className="h-4 w-20" />
                  </div>
                </div>

                {/* Booking button */}
                <SkeletonBlock className="mt-6 h-14 w-full rounded-full" />
              </div>

              {/* Vendor card */}
              <div className="rounded-4xl border border-border bg-card p-6 shadow-lg">
                <SkeletonBlock className="h-3 w-20" />

                <div className="mt-5 flex items-center gap-4">
                  <SkeletonBlock className="h-16 w-16 shrink-0 rounded-full" />

                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBlock className="h-5 w-36 max-w-full" />
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
          <div className="mb-6 flex items-center justify-between gap-4">
            <SkeletonBlock className="h-8 w-48" />
            <SkeletonBlock className="h-4 w-20" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-3xl border border-border bg-card"
              >
                <SkeletonBlock className="aspect-16/10 w-full rounded-none" />

                <div className="space-y-3 p-4">
                  <SkeletonBlock className="h-5 w-3/4" />
                  <div className="flex items-center justify-between">
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
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-20" />
            <SkeletonBlock className="h-3 w-16" />
          </div>
          <SkeletonBlock className="h-12 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}
