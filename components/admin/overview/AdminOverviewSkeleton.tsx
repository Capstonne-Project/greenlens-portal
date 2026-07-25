/** Shared loading skeleton for admin overview (RSC-safe — no hooks). */
export function AdminOverviewSkeleton() {
  return (
    <div
      className="flex w-full min-w-0 animate-pulse flex-col gap-3"
      aria-busy="true"
      aria-label="Đang tải tổng quan"
    >
      <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="h-3 w-72 rounded bg-muted" />
        </div>
        <div className="h-8 w-56 rounded-lg bg-muted" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="h-40 rounded-card bg-muted" />
        <div className="h-40 rounded-card bg-muted" />
        <div className="h-40 rounded-card bg-muted" />
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        <div className="h-[280px] rounded-card bg-muted lg:col-span-5" />
        <div className="h-[280px] rounded-card bg-muted lg:col-span-3" />
        <div className="h-[280px] rounded-card bg-muted lg:col-span-4" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="h-40 rounded-card bg-muted" />
        <div className="h-40 rounded-card bg-muted" />
      </div>
    </div>
  );
}
