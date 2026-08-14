export default function OfficerDashboardLoading() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Đang tải tổng quan">
      <div className="h-10 w-56 rounded-lg bg-muted" />
      <div className="h-48 rounded-2xl bg-muted/70" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {['a', 'b', 'c'].map(key => (
          <div key={key} className="h-52 rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
    </div>
  );
}
