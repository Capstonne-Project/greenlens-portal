/** Shared loading skeleton for admin overview (RSC-safe — no hooks). */
export function AdminOverviewSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 animate-pulse flex-col gap-2"
      aria-busy="true"
      aria-label="Đang tải tổng quan"
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[minmax(0,1fr)]">
        <div className="min-h-0 rounded-card bg-muted md:col-span-1 lg:col-span-3 lg:col-start-1 lg:row-start-1" />
        <div className="min-h-0 rounded-card bg-muted md:col-span-1 lg:col-span-3 lg:col-start-1 lg:row-start-2" />
        <div className="min-h-0 rounded-card bg-muted md:col-span-1 lg:col-span-3 lg:col-start-1 lg:row-start-3" />
        <div className="min-h-0 rounded-card bg-muted md:col-span-1 lg:col-span-5 lg:col-start-4 lg:row-start-1" />
        <div className="min-h-0 rounded-card bg-muted md:col-span-2 lg:col-span-5 lg:col-start-4 lg:row-start-2" />
        <div className="min-h-0 rounded-card bg-muted md:col-span-2 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:row-span-2" />
        <div className="min-h-0 rounded-card bg-muted md:col-span-1 lg:col-span-4 lg:col-start-9 lg:row-start-3" />
      </div>
    </div>
  );
}
