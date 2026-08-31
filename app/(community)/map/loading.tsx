export default function PublicMapLoading() {
  return (
    <div className="absolute inset-0 z-0 animate-pulse bg-slate-200" aria-hidden>
      <div className="absolute top-4 left-4 right-4 h-16 rounded-2xl bg-slate-300/80" />
      <div className="absolute top-24 right-4 hidden h-64 w-64 rounded-2xl bg-slate-300/70 lg:block" />
    </div>
  );
}
