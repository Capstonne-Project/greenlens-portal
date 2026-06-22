import { mapDataPanelClass, mapOverviewPanelClass } from '@/lib/map/mapShellStyles';

export default function OfficerCompaniesLoading() {
  return (
    <div className={`${mapOverviewPanelClass()} animate-pulse`}>
      <div className={`${mapDataPanelClass()} space-y-4`}>
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="flex gap-3">
          <div className="h-8 w-32 rounded bg-slate-200" />
          <div className="h-8 w-64 rounded bg-slate-200" />
        </div>
        <div className="h-[420px] rounded border border-slate-200 bg-white" />
        <div className="flex justify-between">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-4 w-32 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
