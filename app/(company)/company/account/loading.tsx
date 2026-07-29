export default function CompanyAccountLoading() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-2xl bg-emerald-100/70" />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <div className="h-56 animate-pulse rounded-2xl bg-emerald-50/80" />
          <div className="h-48 animate-pulse rounded-2xl bg-emerald-50/80" />
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-emerald-50/80" />
      </div>
    </div>
  );
}
