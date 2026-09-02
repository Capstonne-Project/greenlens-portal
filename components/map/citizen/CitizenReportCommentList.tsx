import Image from 'next/image';
import { Heart, MessageCircle, Smartphone } from 'lucide-react';
import { useCitizenReportComments } from '@/hooks/useCitizenReportComments';
import { getAndroidApkLinkProps } from '@/lib/constants/publicSite';

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? '';
  return last.slice(0, 1).toUpperCase() || '?';
}

interface CitizenReportCommentListProps {
  reportId: string;
  isDialogOpen: boolean;
}

/**
 * Danh sách bình luận công khai — xem được không cần đăng nhập (BE `AllowAnonymous`). Viết/thích
 * bình luận vẫn cần tài khoản, nên các hành động đó điều hướng sang tải app di động thay vì bắt
 * đăng nhập ngay trên web.
 */
export function CitizenReportCommentList({
  reportId,
  isDialogOpen,
}: CitizenReportCommentListProps) {
  const { data, isLoading, isError } = useCitizenReportComments(reportId, {
    enabled: isDialogOpen,
  });
  const comments = data?.items ?? [];
  const apkProps = getAndroidApkLinkProps();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <MessageCircle className="size-4 text-slate-400" aria-hidden />
          Bình luận
          {data ? <span className="text-slate-400">({data.pagination.totalItems})</span> : null}
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map(i => (
            <div key={i} className="flex animate-pulse gap-2.5">
              <div className="size-8 shrink-0 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-3 w-full rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className="text-xs text-slate-400">Không tải được bình luận. Thử lại sau.</p>
      ) : comments.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-3.5 py-4 text-center text-xs text-slate-400">
          Chưa có bình luận nào cho báo cáo này.
        </p>
      ) : (
        <ul className="space-y-3.5">
          {comments.map(comment => (
            <li key={comment.id} className="flex gap-2.5">
              {comment.authorAvatarUrl ? (
                <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-slate-100">
                  <Image
                    src={comment.authorAvatarUrl}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                    unoptimized
                  />
                </span>
              ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700">
                  {initialsFromName(comment.authorName)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl bg-slate-50 px-3 py-2">
                  <p className="text-[12px] font-semibold text-slate-900">{comment.authorName}</p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-700">
                    {comment.content}
                  </p>
                </div>
                <div className="mt-1 flex items-center gap-3 px-1 text-[11px] text-slate-400">
                  <span>{formatRelativeTime(comment.createdAt)}</span>
                  {comment.likeCount > 0 ? (
                    <span className="flex items-center gap-1">
                      <Heart className="size-3 fill-current" aria-hidden />
                      {comment.likeCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <a
        {...apkProps}
        className="flex items-center gap-2.5 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 px-3.5 py-3 text-emerald-800 transition-colors hover:bg-emerald-50"
      >
        <Smartphone className="size-4 shrink-0" aria-hidden />
        <span className="text-[12px] leading-snug">
          <span className="font-semibold">Tải ứng dụng GreenLens</span> để viết bình luận, thích và
          theo dõi báo cáo này.
        </span>
      </a>
    </div>
  );
}
