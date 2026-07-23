import { Skeleton } from '@/components/ui/skeleton';

export default function OfficerReportsLoading() {
  return (
    <div className="space-y-3">
      <div className="border-b border-slate-200 pb-3">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-72" />
      </div>
      <Skeleton className="h-[420px] w-full rounded-md border border-slate-200" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
