export default function AdminMapLoading() {
  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[560px] w-full min-w-0 animate-pulse flex-col gap-4">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-muted" />
        <div className="h-4 w-48 rounded bg-muted" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="min-h-[320px] flex-1 rounded-xl bg-muted" />
        <div className="h-72 w-full shrink-0 rounded-xl bg-muted lg:h-auto lg:w-80" />
      </div>
    </div>
  );
}
