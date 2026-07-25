import { Skeleton } from '@/components/ui/skeleton';

/** Route-level first paint — shadcn Skeleton (table pages). isPending trong table vẫn Loader2. */
export default function OfficerVerifyLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="space-y-2 border-b border-slate-200 pb-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="flex gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-3">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              <Skeleton className="size-10 shrink-0 rounded" />
              <Skeleton className="h-4 min-w-0 flex-1" />
              <Skeleton className="h-4 w-24 shrink-0" />
              <Skeleton className="h-4 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
