import { Skeleton } from '@/components/ui/skeleton';

/** Route-level first paint — chi tiết so sánh tái phát. */
export default function OfficerRecurrenceCandidateDetailLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="space-y-2 border-b border-slate-200 pb-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-7 w-32 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="aspect-video w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
