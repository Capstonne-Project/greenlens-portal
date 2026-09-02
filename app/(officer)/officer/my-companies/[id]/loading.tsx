import { Skeleton } from '@/components/ui/skeleton';

export default function OfficerMyCompanyDetailLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-9 w-2/3 max-w-lg" />
      <Skeleton className="h-4 w-1/2 max-w-md" />
      <Skeleton className="h-[280px] w-full rounded-sm" />
      <Skeleton className="h-48 w-full rounded-sm" />
    </div>
  );
}
