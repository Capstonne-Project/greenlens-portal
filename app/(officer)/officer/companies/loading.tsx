import { Skeleton } from '@/components/ui/skeleton';

/** Route-level chrome skeleton — titles/toolbar/table shell (không gắn API). */
export default function OfficerCompaniesLoading() {
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-3">
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <Skeleton className="h-[420px] w-full rounded-md border border-slate-200" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
