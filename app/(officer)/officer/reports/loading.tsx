export default function OfficerReportsLoading() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="border-b border-slate-200 pb-3">
        <div className="h-7 w-32 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-56 rounded bg-slate-200" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-28 rounded bg-slate-200" />
        <div className="h-8 w-72 rounded bg-slate-200" />
      </div>
      <div className="h-[420px] rounded border border-slate-200 bg-white" />
      <div className="flex justify-between">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-4 w-32 rounded bg-slate-200" />
      </div>
    </div>
  );
}
