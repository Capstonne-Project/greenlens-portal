export default function CommunityCleanupPublicLoading() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-2xl animate-pulse px-4 py-8 sm:px-6 sm:py-12">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="mt-3 h-8 w-3/4 rounded bg-muted" />
        <div className="mt-3 h-5 w-28 rounded-full bg-muted" />
        <div className="mt-6 aspect-video w-full rounded-xl bg-muted" />
        <div className="mt-5 space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
        </div>
        <div className="mt-6 h-36 rounded-xl bg-muted" />
      </div>
    </main>
  );
}
