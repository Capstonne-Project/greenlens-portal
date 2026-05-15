export default function AdminOverviewLoading() {
  return (
    <div className="space-y-8">
      <div className="h-5 w-72 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-card bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-card bg-muted" />
        <div className="h-80 rounded-card bg-muted" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-72 rounded-card bg-muted lg:col-span-2" />
        <div className="h-72 rounded-card bg-muted" />
      </div>
    </div>
  );
}
