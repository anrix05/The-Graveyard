export default function DashboardLoading() {
  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col relative antialiased animate-pulse">
      {/* Sidebar skeleton on desktop */}
      <div className="hidden lg:block fixed top-0 left-0 bottom-0 w-[264px] bg-bg border-r border-line p-4 space-y-6">
        <div className="h-8 w-36 bg-surface-2 rounded-lg" />
        <div className="space-y-2 pt-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 w-full bg-surface rounded-xl" />
          ))}
        </div>
      </div>

      {/* Main column skeleton */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[264px]">
        {/* Topbar skeleton */}
        <div className="w-full h-[var(--topbar-h)] bg-bg/90 border-b border-line px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="h-5 w-32 bg-surface-2 rounded-lg" />
          <div className="h-8 w-24 bg-surface rounded-full" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 w-full max-w-[1200px] 3xl:max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-8">
          <div className="h-10 w-48 bg-surface-2 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-surface rounded-card border border-line" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-surface rounded-card border border-line" />
            <div className="h-64 bg-surface rounded-card border border-line" />
          </div>
        </div>
      </div>
    </div>
  );
}
