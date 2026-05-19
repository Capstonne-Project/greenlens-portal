export default function AdminOrganizationLoading() {
  return (
    <div className="w-full min-w-0 animate-pulse space-y-6">
      <div className="h-8 w-96 rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-card bg-muted" />
        ))}
      </div>
      <div className="h-80 rounded-card bg-muted" />
    </div>
  );
}
