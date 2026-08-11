import { MapPin, Users } from 'lucide-react';
import Image from 'next/image';

export interface MapReportPopupCardData {
  title: string;
  code: string;
  address?: string | null;
  status?: string;
  description?: string | null;
  imageUrl?: string | null;
  categoryIconUrl?: string | null;
  reporterCount?: number;
}

interface MapReportPopupCardProps {
  report: MapReportPopupCardData;
}

/** Card popup dùng chung cho report point — cả circle 2D (map mode) và pillar 3D (globe mode). */
export function MapReportPopupCard({ report }: MapReportPopupCardProps) {
  return (
    <div className="w-[240px] overflow-hidden rounded-lg bg-card text-card-foreground shadow-sm">
      {report.imageUrl ? (
        <div className="relative h-24 w-full bg-muted">
          <Image
            src={report.imageUrl}
            alt={report.title}
            fill
            sizes="240px"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}

      <div className="space-y-1.5 p-2.5">
        <div className="flex items-start gap-2">
          {report.categoryIconUrl ? (
            <span className="relative mt-0.5 size-6 shrink-0 overflow-hidden rounded-md bg-emerald-50">
              <Image
                src={report.categoryIconUrl}
                alt=""
                fill
                sizes="24px"
                className="object-contain p-0.5"
                unoptimized
              />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
              {report.title}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              #{report.code}
              {report.status ? ` · ${report.status}` : null}
            </p>
          </div>
        </div>

        {report.description ? (
          <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
            {report.description}
          </p>
        ) : null}

        {report.address ? (
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span className="line-clamp-2">{report.address}</span>
          </p>
        ) : null}

        {typeof report.reporterCount === 'number' ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800">
            <Users className="size-3.5" aria-hidden />
            {report.reporterCount} người báo
          </span>
        ) : null}
      </div>
    </div>
  );
}
