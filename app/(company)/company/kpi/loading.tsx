export default function CompanyKpiLoading() {
  return (
    <div className="space-y-5">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-emerald-100/60" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-emerald-50/80" />
        ))}
      </div>
    </div>
  );
}
