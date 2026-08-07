/** Shared loading skeleton for admin overview (RSC-safe — no hooks). */
export function AdminOverviewSkeleton() {
  return (
    <div
      className="flex w-full min-w-0 animate-pulse flex-col gap-3"
      aria-busy="true"
      aria-label="Đang tải tổng quan"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[minmax(150px,1fr)]">
        {/* Column 1 — left stack */}
        <div className="min-h-[150px] rounded-card bg-muted md:col-span-1 lg:col-span-3 lg:col-start-1 lg:row-start-1" />
        <div className="min-h-[150px] rounded-card bg-muted md:col-span-1 lg:col-span-3 lg:col-start-1 lg:row-start-2" />
        <div className="min-h-[150px] rounded-card bg-muted md:col-span-1 lg:col-span-3 lg:col-start-1 lg:row-start-3" />
        {/* Column 2 — trend + alerts */}
        <div className="min-h-[150px] rounded-card bg-muted md:col-span-1 lg:col-span-5 lg:col-start-4 lg:row-start-1" />
        <div className="min-h-[240px] rounded-card bg-muted md:col-span-2 lg:col-span-5 lg:col-start-4 lg:row-start-2 lg:row-span-2" />
        {/* Column 3 — portrait map + queue aging */}
        <div className="h-[280px] rounded-card bg-muted sm:h-[320px] md:col-span-2 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:row-span-2 lg:h-auto" />
        <div className="min-h-[150px] rounded-card bg-muted md:col-span-1 lg:col-span-4 lg:col-start-9 lg:row-start-3" />
      </div>
    </div>
  );
}
