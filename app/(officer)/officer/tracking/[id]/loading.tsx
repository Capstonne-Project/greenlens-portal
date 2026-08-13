export default function OfficerTrackingDetailLoading() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="h-10 w-full max-w-md animate-pulse rounded bg-muted" />
      <div className="min-h-0 flex-1 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
