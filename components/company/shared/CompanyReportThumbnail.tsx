'use client';

import { cn } from '@/lib/utils';
import { resolveDisplayReportImageUrl } from '@/utils/reportThumbnail';
import { ImageIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

type CompanyReportThumbnailProps = {
  url?: string | null;
  alt: string;
  /** Hiển thị khi không có / lỗi ảnh — thường là mã báo cáo. */
  code?: string;
  size?: 'sm' | 'md';
  className?: string;
  eager?: boolean;
};

const SIZE_CLASS = {
  sm: 'size-12 rounded-lg',
  md: 'size-16 rounded-xl',
} as const;

function codeFallbackLabel(code: string | undefined): string | null {
  if (!code?.trim()) return null;
  const compact = code.replace(/^RPT-/i, '').replace(/-/g, '');
  return compact.slice(0, 4).toUpperCase() || null;
}

function CompanyReportThumbnailImage({
  displayUrl,
  alt,
  eager,
}: {
  displayUrl: string;
  alt: string;
  eager: boolean;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL CDN/BE đa dạng; tránh next/image chặn host ngoài
    <img
      src={displayUrl}
      alt={alt}
      className="relative z-10 size-full object-cover"
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}

/** Ảnh đại diện báo cáo trong bảng / card company. */
export function CompanyReportThumbnail({
  url,
  alt,
  code,
  size = 'md',
  className,
  eager = false,
}: CompanyReportThumbnailProps) {
  const frameClass = SIZE_CLASS[size];
  const displayUrl = useMemo(() => resolveDisplayReportImageUrl(url), [url]);
  const fallbackLabel = codeFallbackLabel(code);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden border border-emerald-100/80 bg-emerald-50/50 dark:border-border dark:bg-muted/40',
        frameClass,
        className
      )}
      title={displayUrl && displayUrl !== url ? `${alt} (dev fallback — URL seed BE)` : alt}
    >
      {fallbackLabel ? (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-100/90 text-[10px] font-bold tracking-wide text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {fallbackLabel}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-emerald-700/35 dark:text-muted-foreground/50">
          <ImageIcon className={cn(size === 'sm' ? 'size-4' : 'size-5')} aria-hidden />
        </div>
      )}
      {displayUrl ? (
        <CompanyReportThumbnailImage
          key={displayUrl}
          displayUrl={displayUrl}
          alt={alt}
          eager={eager}
        />
      ) : null}
    </div>
  );
}
