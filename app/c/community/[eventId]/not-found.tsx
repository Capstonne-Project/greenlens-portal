import { APP_NAME } from '@/lib/constants/brand';

export default function CommunityCleanupPublicNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
        {APP_NAME}
      </p>
      <h1 className="mt-2 text-xl font-semibold text-foreground">Chương trình không tồn tại</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Chương trình dọn cộng đồng này đã bị hủy hoặc đường dẫn không còn hiệu lực.
      </p>
    </main>
  );
}
