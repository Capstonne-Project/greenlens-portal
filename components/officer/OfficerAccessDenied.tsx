import Link from 'next/link';
import { Button } from '@/components/ui/button';

type OfficerAccessDeniedProps = {
  title?: string;
  message: string;
  homeHref: string;
};

export function OfficerAccessDenied({
  title = 'Không có quyền truy cập',
  message,
  homeHref,
}: OfficerAccessDeniedProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">{message}</p>
      <Button asChild className="mt-6 bg-emerald-600 text-white hover:bg-emerald-500">
        <Link href={homeHref}>Về trang chính</Link>
      </Button>
    </div>
  );
}
