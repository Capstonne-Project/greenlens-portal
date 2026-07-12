export default function OfficerMapLoading() {
  return (
    <div className="absolute inset-0 z-0 animate-pulse bg-slate-200" aria-hidden>
      <div className="absolute top-4 left-4 h-10 w-48 rounded-lg bg-slate-300/80" />
      <div className="absolute top-4 right-4 h-32 w-72 rounded-lg bg-slate-300/80" />
    </div>
  );
}
