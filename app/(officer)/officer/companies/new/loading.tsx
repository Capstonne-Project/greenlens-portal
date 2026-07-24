import { Skeleton } from '@/components/ui/skeleton';

export default function OfficerCompanyCreateLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Skeleton className="h-[560px] w-full rounded-xl border border-slate-200" />
        <Skeleton className="h-72 w-full rounded-xl border border-slate-200" />
      </div>
    </div>
  );
}
