export default function CompanyOverviewLoading() {
  return (
    <div className="space-y-8">
      <div className="h-16 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-card bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-56 animate-pulse rounded-card bg-muted lg:col-span-3" />
        <div className="h-56 animate-pulse rounded-card bg-muted lg:col-span-2" />
      </div>
    </div>
  );
}
