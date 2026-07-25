import { Skeleton } from '@/components/ui/skeleton';

export default function OfficerCompanyDetailLoading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-36" />
      <div className="space-y-2 border-b border-slate-200 pb-4">
        <Skeleton className="h-9 w-2/3 max-w-lg" />
        <Skeleton className="h-4 w-1/2 max-w-md" />
      </div>
      <Skeleton className="h-40 w-full rounded-md" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    </div>
  );
}
