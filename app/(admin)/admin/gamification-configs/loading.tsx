export default function AdminGamificationConfigsLoading() {
  return (
    <div className="w-full min-w-0 animate-pulse space-y-6">
      <div className="h-4 w-2/3 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-10 w-64 rounded-full bg-muted" />
      <div className="h-80 rounded-2xl bg-muted" />
    </div>
  );
}
