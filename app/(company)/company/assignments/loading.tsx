export default function CompanyAssignmentsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-56 rounded-lg bg-emerald-100" />
      <div className="h-4 w-96 max-w-full rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-emerald-50" />
        ))}
      </div>
      <div className="h-80 rounded-lg bg-emerald-50/60" />
    </div>
  );
}
