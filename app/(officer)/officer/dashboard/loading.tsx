export default function OfficerDashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="rounded-2xl bg-muted/40 px-6 pb-7 pt-6">
        <div className="mb-5 space-y-2">
          <div className="h-7 w-52 rounded-lg bg-muted" />
          <div className="h-4 w-40 rounded bg-muted/70" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {['a', 'b', 'c', 'd'].map(k => (
            <div key={k} className="h-24 rounded-xl bg-muted/50" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-border bg-muted/30" />
        <div className="h-64 rounded-xl border border-border bg-muted/30" />
      </div>
    </div>
  );
}
