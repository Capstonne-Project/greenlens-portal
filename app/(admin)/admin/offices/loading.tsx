export default function AdminOfficesLoading() {
  return (
    <div className="w-full min-w-0 animate-pulse space-y-6">
      <div className="flex justify-between gap-4">
        <div className="h-5 w-64 rounded bg-muted" />
        <div className="h-10 w-40 rounded-lg bg-muted" />
      </div>
      <div className="h-12 rounded-lg bg-muted" />
      <div className="h-96 rounded-card bg-muted" />
    </div>
  );
}
