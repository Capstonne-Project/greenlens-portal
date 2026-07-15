export default function AdminNotificationTemplatesLoading() {
  return (
    <div className="w-full min-w-0 animate-pulse space-y-6">
      <div className="flex justify-between gap-4">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-10 w-36 rounded-lg bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-10 w-80 rounded-full bg-muted" />
      <div className="h-96 rounded-2xl bg-muted" />
    </div>
  );
}
