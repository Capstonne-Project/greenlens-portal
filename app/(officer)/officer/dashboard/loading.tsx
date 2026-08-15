export default function OfficerDashboardLoading() {
  return (
    <div
      className="flex h-full min-h-0 flex-col gap-2"
      aria-busy="true"
      aria-label="Đang tải tổng quan"
    >
      <div className="flex shrink-0 flex-col gap-2">
        <div className="h-7 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-full max-w-md animate-pulse rounded-lg bg-muted/70" />
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        {['a', 'b', 'c', 'd'].map(key => (
          <div key={key} className="h-20 animate-pulse rounded-xl bg-muted/60" />
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-12">
        <div className="animate-pulse rounded-xl bg-muted/40 lg:col-span-8" />
        <div className="animate-pulse rounded-xl bg-muted/40 lg:col-span-4" />
        <div className="animate-pulse rounded-xl bg-muted/40 lg:col-span-6" />
        <div className="animate-pulse rounded-xl bg-muted/40 lg:col-span-6" />
      </div>
    </div>
  );
}
