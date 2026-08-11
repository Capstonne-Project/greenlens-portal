import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Skeleton hiển thị trong lúc Goong style (vector) tải style JSON + sprite + tiles — chậm hơn
 * đáng kể so với OSM raster. Nền dotgrid khớp pattern `ward-mask-fill` của map thật, tránh
 * người dùng thấy màn hình trắng/vị trí sai trong lúc chờ.
 *
 * Luôn mounted (không unmount đột ngột khi `ready`) — chỉ fade `opacity` qua CSS transition để
 * chuyển sang map mượt thay vì "chớp" cứng. `pointer-events-none` khi ẩn để không chặn tương
 * tác map bên dưới; `duration-500` khớp cảm giác mượt của các transition khác trong map shell.
 */
export function MapLoadingSkeleton({ ready }: { ready: boolean }) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center bg-white transition-opacity duration-500 ease-out',
        ready ? 'pointer-events-none opacity-0' : 'opacity-100'
      )}
      style={{
        backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        color: '#d9dde3',
      }}
      aria-hidden
    >
      <Loader2 className="size-6 animate-spin text-slate-300" strokeWidth={1.75} />
    </div>
  );
}
