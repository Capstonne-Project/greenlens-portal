export default function OfficerTrackingLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-muted" />
        <div className="h-4 w-96 max-w-full rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {['a', 'b', 'c', 'd', 'e', 'f'].map(k => (
          <div key={k} className="h-28 rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
      <div className="h-96 rounded-xl border border-border bg-muted/30" />
    </div>
  );
}
