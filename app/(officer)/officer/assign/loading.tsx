export default function OfficerAssignLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6 animate-pulse">
      <div className="shrink-0 space-y-2">
        <div className="h-8 w-56 rounded-lg bg-muted" />
      </div>
      <div className="h-10 w-full max-w-md rounded-lg bg-muted/70" />
      <div className="h-96 rounded-xl border border-border bg-muted/30" />
    </div>
  );
}
