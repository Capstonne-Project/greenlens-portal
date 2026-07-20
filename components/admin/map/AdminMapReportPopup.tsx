'use client';

import type { MapReportDetailItem } from '@/lib/api/services/fetchMap';
import { reportStatusLabelVi } from '@/utils/adminReportUi';
import { MapPin, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface AdminMapReportPopupProps {
  report: MapReportDetailItem;
}

export function AdminMapReportPopup({ report }: AdminMapReportPopupProps) {
  return (
    <div className="w-[260px] overflow-hidden rounded-lg bg-card text-card-foreground shadow-sm">
      {report.imageUrl ? (
        <div className="relative h-28 w-full bg-muted">
          <Image
            src={report.imageUrl}
            alt={report.title}
            fill
            sizes="260px"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}

      <div className="space-y-2 p-3">
        <div className="flex items-start gap-2">
          {report.categoryIconUrl ? (
            <span className="relative mt-0.5 size-7 shrink-0 overflow-hidden rounded-md bg-emerald-50">
              <Image
                src={report.categoryIconUrl}
                alt=""
                fill
                sizes="28px"
                className="object-contain p-0.5"
                unoptimized
              />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
              {report.title}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              #{report.code}
              {report.status ? ` · ${reportStatusLabelVi(report.status)}` : null}
            </p>
          </div>
        </div>

        {report.description ? (
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {report.description}
          </p>
        ) : null}

        {report.address ? (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span className="line-clamp-2">{report.address}</span>
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800">
            <Users className="size-3.5" aria-hidden />
            {report.reporterCount} người báo
          </span>
          <Link
            href={`/admin/reports/${report.id}`}
            className="text-[11px] font-semibold text-emerald-700 underline-offset-2 hover:underline"
          >
            Chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}
