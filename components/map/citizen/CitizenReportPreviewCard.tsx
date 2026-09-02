import { MapPin, Users } from 'lucide-react';
import Image from 'next/image';
import { publicMapGuestStatusLabelVi } from '@/lib/constants/reportStatus';
import type { CitizenMapWardReportPin } from '@/lib/api/models/citizenMap';

const SEVERITY_LABEL_VI: Record<CitizenMapWardReportPin['severity'], string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
  Critical: 'Khẩn cấp',
};

/** Badge nổi trên ảnh — nền đặc theo severity, chữ trắng, giống style thẻ du lịch cao cấp. */
const SEVERITY_BADGE_CLASSES: Record<CitizenMapWardReportPin['severity'], string> = {
  Low: 'bg-emerald-500',
  Medium: 'bg-amber-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-600',
};

interface CitizenReportPreviewCardProps {
  report: CitizenMapWardReportPin;
  onViewDetail: () => void;
}

/** Popup nhỏ nổi ngay trên điểm rác thải khi bấm — bản tóm tắt trước khi mở dialog chi tiết. */
export function CitizenReportPreviewCard({ report, onViewDetail }: CitizenReportPreviewCardProps) {
  return (
    <div className="w-[260px] max-w-full overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
      <div className="relative h-32 w-full bg-muted">
        {report.imageUrl ? (
          <Image
            src={report.imageUrl}
            alt={report.title}
            fill
            sizes="260px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 text-emerald-300">
            <MapPin className="size-8" strokeWidth={1.5} aria-hidden />
          </div>
        )}

        <span
          className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm ${SEVERITY_BADGE_CLASSES[report.severity]}`}
        >
          {SEVERITY_LABEL_VI[report.severity]}
        </span>

        {report.categoryIconUrl ? (
          <span className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
            <Image
              src={report.categoryIconUrl}
              alt=""
              width={18}
              height={18}
              className="object-contain"
              unoptimized
            />
          </span>
        ) : null}
      </div>

      <div className="px-3.5 pb-3.5 pt-3">
        <p className="line-clamp-1 text-[13px] font-semibold leading-snug text-slate-900">
          {report.title}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {publicMapGuestStatusLabelVi(report.status)}
        </p>

        {report.address ? (
          <p className="mt-2 flex items-start gap-1 text-[11px] text-slate-500">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className="line-clamp-1">{report.address}</span>
          </p>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2 border-y border-slate-100 py-2.5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Mức độ</p>
            <p className="text-[13px] font-semibold text-slate-900">
              {SEVERITY_LABEL_VI[report.severity]}
            </p>
          </div>
          <div className="border-l border-slate-100 pl-2.5">
            <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              <Users className="size-3" aria-hidden />
              Người báo
            </p>
            <p className="text-[13px] font-semibold text-slate-900">{report.reporterCount}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewDetail}
          className="mt-3 w-full rounded-xl bg-slate-900 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}
