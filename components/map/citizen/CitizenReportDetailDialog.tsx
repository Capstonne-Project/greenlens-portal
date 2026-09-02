import Image from 'next/image';
import { CalendarDays, MapPin, Tag, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { publicMapGuestStatusLabelVi } from '@/lib/constants/reportStatus';
import type { CitizenMapWardReportPin } from '@/lib/api/models/citizenMap';
import { CitizenReportCommentList } from './CitizenReportCommentList';

const SEVERITY_LABEL_VI: Record<CitizenMapWardReportPin['severity'], string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
  Critical: 'Khẩn cấp',
};

/** Badge nổi trên ảnh — đồng bộ màu với popup preview trên bản đồ. */
const SEVERITY_BADGE_CLASSES: Record<CitizenMapWardReportPin['severity'], string> = {
  Low: 'bg-emerald-500',
  Medium: 'bg-amber-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-600',
};

function formatCreatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatTile({ icon, label, value }: StatTileProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-[13px] font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

interface CitizenReportDetailDialogProps {
  report: CitizenMapWardReportPin | null;
  onOpenChange: (open: boolean) => void;
}

/** Dialog chi tiết to, đẹp — mở khi người dùng bấm "Xem chi tiết" từ popup preview trên bản đồ. */
export function CitizenReportDetailDialog({
  report,
  onOpenChange,
}: CitizenReportDetailDialogProps) {
  const isOpen = Boolean(report);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="citizen-report-dialog max-w-2xl overflow-hidden rounded-3xl border-none p-0 shadow-2xl">
        {report ? (
          <div className="max-h-[88vh] overflow-y-auto">
            <div className="relative h-64 w-full bg-slate-100 sm:h-80">
              {report.imageUrl ? (
                <Image
                  src={report.imageUrl}
                  alt={report.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 640px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 text-emerald-300">
                  <MapPin className="size-12" strokeWidth={1.5} aria-hidden />
                </div>
              )}

              {/* Nền tròn cho nút đóng mặc định của DialogContent (right-4 top-4) — không thì icon X trong suốt trên ảnh. */}
              <span
                className="pointer-events-none absolute right-4 top-4 z-10 size-7 rounded-full bg-black/40 backdrop-blur-sm"
                aria-hidden
              />

              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm ${SEVERITY_BADGE_CLASSES[report.severity]}`}
                  >
                    Mức độ: {SEVERITY_LABEL_VI[report.severity]}
                  </span>
                  <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                    {publicMapGuestStatusLabelVi(report.status)}
                  </span>
                </div>
                {report.categoryIconUrl ? (
                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                    <Image
                      src={report.categoryIconUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="object-contain"
                      unoptimized
                    />
                  </span>
                ) : null}
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {report.title}
                </DialogTitle>
                <p className="mt-0.5 text-[13px] text-slate-400">Mã báo cáo #{report.code}</p>
              </div>

              {report.description ? (
                <p className="text-sm leading-relaxed text-slate-600">{report.description}</p>
              ) : null}

              <div className="grid gap-2.5 sm:grid-cols-2">
                {report.address ? (
                  <StatTile
                    icon={<MapPin className="size-3.5" aria-hidden />}
                    label="Địa chỉ"
                    value={report.address}
                  />
                ) : null}
                <StatTile
                  icon={<Tag className="size-3.5" aria-hidden />}
                  label="Danh mục"
                  value={report.categoryCode}
                />
                <StatTile
                  icon={<CalendarDays className="size-3.5" aria-hidden />}
                  label="Thời gian gửi"
                  value={formatCreatedAt(report.createdAt)}
                />
                {report.reporterCount > 0 ? (
                  <StatTile
                    icon={<Users className="size-3.5" aria-hidden />}
                    label="Số người đã báo"
                    value={`${report.reporterCount} người`}
                  />
                ) : null}
              </div>

              <div className="border-t border-slate-100 pt-5">
                <CitizenReportCommentList reportId={report.id} isDialogOpen={isOpen} />
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
