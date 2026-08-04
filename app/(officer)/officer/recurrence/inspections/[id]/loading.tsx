import { Skeleton } from '@/components/ui/skeleton';

/** Route-level first paint — chi tiết hồ sơ xử phạt. */
export default function OfficerInspectionDetailLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 px-4 pb-16 pt-2 sm:px-6 sm:pb-20 lg:px-8">
      <div className="space-y-3 border-b border-slate-200 pb-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}
