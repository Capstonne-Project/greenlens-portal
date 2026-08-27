import { fetchPublicCommunityCleanupPreview } from '@/lib/api/server/fetchPublicCommunityCleanup';
import { APP_NAME } from '@/lib/constants/brand';
import {
  COMMUNITY_CLEANUP_STATUS_BADGE_CLASSES,
  communityCleanupStatusLabelVi,
} from '@/lib/constants/communityCleanupStatus';
import { cn } from '@/lib/utils';
import { CalendarClock, MapPin, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface CommunityCleanupPublicPageProps {
  params: Promise<{ eventId: string }>;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export async function generateMetadata({
  params,
}: CommunityCleanupPublicPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const data = await fetchPublicCommunityCleanupPreview(eventId);
  if (!data) {
    return { title: 'Chương trình không tồn tại' };
  }

  const description = data.description?.trim() || `Chương trình dọn cộng đồng ${APP_NAME}`;
  const imageUrl = data.thumbnailUrl?.trim() || data.share.imageUrl?.trim() || undefined;

  return {
    title: data.title,
    description,
    openGraph: {
      title: data.title,
      description,
      url: data.share.url || undefined,
      type: 'website',
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: data.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function CommunityCleanupPublicPage({
  params,
}: CommunityCleanupPublicPageProps) {
  const { eventId } = await params;
  const data = await fetchPublicCommunityCleanupPreview(eventId);
  if (!data) notFound();

  const imageUrl = data.thumbnailUrl?.trim() || data.share.imageUrl?.trim() || null;

  return (
    <main className="flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          {APP_NAME}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {data.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
              COMMUNITY_CLEANUP_STATUS_BADGE_CLASSES[data.status]
            )}
          >
            {communityCleanupStatusLabelVi(data.status)}
          </span>
          {data.categoryName ? (
            <span className="text-xs text-muted-foreground">{data.categoryName}</span>
          ) : null}
        </div>

        {imageUrl ? (
          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl bg-muted">
            <Image
              src={imageUrl}
              alt={data.title}
              fill
              sizes="(max-width: 672px) 100vw, 42rem"
              className="object-cover"
              unoptimized
              priority
            />
          </div>
        ) : null}

        {data.description ? (
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{data.description}</p>
        ) : null}

        <ul className="mt-6 space-y-3 rounded-xl border border-border bg-muted/30 px-4 py-4">
          <li className="flex items-start gap-2.5 text-sm">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
            <div>
              <p className="font-medium text-foreground">Bắt đầu dọn</p>
              <p className="text-muted-foreground">{formatDateTime(data.startsAt)}</p>
              {data.endsAt ? (
                <p className="mt-1 text-muted-foreground">
                  Kết thúc: {formatDateTime(data.endsAt)}
                </p>
              ) : null}
              {data.joinClosesAt ? (
                <p className="mt-1 text-muted-foreground">
                  Đóng đăng ký: {formatDateTime(data.joinClosesAt)}
                </p>
              ) : null}
            </div>
          </li>
          <li className="flex items-start gap-2.5 text-sm">
            <Users className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
            <div>
              <p className="font-medium text-foreground">Chỗ tham gia</p>
              <p className="text-muted-foreground">
                {data.participantCount}/{data.maxParticipants} đã đăng ký · còn {data.spotsLeft} chỗ
              </p>
            </div>
          </li>
          {data.reportAddress || data.meetingNote ? (
            <li className="flex items-start gap-2.5 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
              <div>
                <p className="font-medium text-foreground">Điểm tập trung</p>
                <p className="text-muted-foreground">
                  {data.meetingNote ? `${data.meetingNote}` : null}
                  {data.meetingNote && data.reportAddress ? ' · ' : null}
                  {data.reportAddress}
                </p>
              </div>
            </li>
          ) : null}
        </ul>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Chương trình dọn cộng đồng {APP_NAME}. Mở ứng dụng để đăng ký tham gia.
        </p>
      </div>
    </main>
  );
}
