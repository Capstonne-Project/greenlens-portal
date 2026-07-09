export default function OfficerCompanyCreateLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded bg-slate-200" />
        <div className="h-4 w-56 rounded bg-slate-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="h-[560px] rounded-xl border border-slate-200 bg-white" />
        <div className="h-72 rounded-xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
