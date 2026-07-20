export default function OfficerVerifyLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-72 max-w-full rounded bg-muted/70" />
      </div>
      <div className="h-10 w-full max-w-sm rounded-lg bg-muted/70" />
      <div className="h-96 rounded-xl border border-border bg-muted/30" />
    </div>
  );
}
