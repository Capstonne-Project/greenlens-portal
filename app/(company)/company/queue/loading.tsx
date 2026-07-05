export default function CompanyQueueLoading() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-2xl bg-emerald-100/60" />
      <div className="h-10 w-64 animate-pulse rounded-full bg-emerald-50" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-emerald-50/80" />
        ))}
      </div>
    </div>
  );
}
