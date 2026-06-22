import { AlertTriangle, TrendingUp, Clock, MapPin } from 'lucide-react';
import { mapOverviewPanelClass } from '@/lib/map/mapShellStyles';

export default function OfficerDashboardPage() {
  return (
    <div className={mapOverviewPanelClass()}>
      <OfficerDashboardContent />
    </div>
  );
}

function OfficerDashboardContent() {
  return (
    <div className="space-y-5">
      {/* Dark hero zone */}
      <div className="rounded-2xl bg-[#0f1117] px-6 pb-7 pt-6">
        {/* Page header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-white">Dashboard Tổng quan</h1>
          <p className="text-sm text-slate-400">Ủy bạn nhân </p>
        </div>

        {/* Row 1: 4 stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Báo cáo mới hôm nay"
            value="124"
            tag="+12%"
            tagColor="text-teal-400"
            icon={<TrendingUp className="size-5 text-teal-400" />}
          />
          <StatCard
            label="Chờ xác minh"
            value="48"
            tag="SLA"
            tagColor="text-amber-400"
            icon={<Clock className="size-5 text-amber-400" />}
          />
          <StatCard
            label="Đang xử lý"
            value="31"
            tag="Active"
            tagColor="text-blue-400"
            icon={<AlertTriangle className="size-5 text-blue-400" />}
          />
          <StatCard
            label="Hotspot mở"
            value="7"
            tag="Cảnh báo"
            tagColor="text-red-400"
            icon={<MapPin className="size-5 text-red-400" />}
          />
        </div>
      </div>

      {/* Row 2: 3 content cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Card A: Tiến độ */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Tiến độ xác minh trong ngày</h2>
          <div className="space-y-4">
            <ProgressItem label="Đúng hạn" percent={83} color="bg-teal-500" />
            <ProgressItem label="Vượt SLA" percent={17} color="bg-red-500" />
            <div className="border-t border-gray-100 pt-3">
              <span className="text-xs text-gray-500">Trung bình thời gian phản hồi</span>
              <p className="mt-0.5 text-lg font-bold text-gray-900">3h 12m</p>
            </div>
          </div>
        </div>

        {/* Card B: Top hotspot */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Top hotspot</h2>
          <div className="space-y-3.5">
            <HotspotItem
              dot="bg-emerald-500"
              name="Kênh Tẻ • Q.4"
              stats="16 báo cáo / 7 ngày"
              desc="Chủ yếu rác thải và nước thải"
            />
            <HotspotItem
              dot="bg-amber-400"
              name="Nguyễn Hữu Cảnh • Bình Thạnh"
              stats="11 báo cáo / 30 ngày"
              desc="Khởi phát từ công trình"
            />
            <HotspotItem
              dot="bg-red-500"
              name="Xa lộ Hà Nội • TP Thủ Đức"
              stats="9 báo cáo / 14 ngày"
              desc="Tiếng ồn giờ cao điểm"
            />
          </div>
        </div>

        {/* Card C: Cảnh báo vận hành */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Cảnh báo vận hành</h2>
          <div className="space-y-2.5">
            <AlertItem label="Báo cáo sắp quá SLA xác minh" badge="4" badgeColor="bg-red-500" />
            <AlertItem
              label="Đã xác minh, chưa phân công quá 24h"
              badge="6"
              badgeColor="bg-orange-500"
            />
            <AlertItem label="Cleanup Team đạt 8/10 task" badge="2 team" badgeColor="bg-teal-500" />
            <AlertItem label="Task 3 ngày chưa cập nhật" badge="3" badgeColor="bg-red-500" />
          </div>
        </div>
      </div>

      {/* Row 3: Priority queue + Personal stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        {/* Priority queue table */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Hàng đợi ưu tiên nhanh</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['REPORT', 'LOẠI', 'SEVERITY', 'VỊ TRÍ', 'TRẠNG THÁI', 'QUÁ HẠN XỬ LÝ'].map(
                    h => (
                      <th
                        key={h}
                        className="pb-2.5 pr-4 text-left font-medium tracking-wide text-gray-400"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <QueueRow
                  id="GL-240421-018"
                  desc="Rác thải sinh hoạt chất độc gần kênh"
                  type="Rác thải"
                  severity="Cao"
                  severityColor="text-orange-500"
                  location="Q.4 • P.9"
                  status="Đã gửi"
                  sla="02:14:31"
                  slaOverdue={false}
                />
                <QueueRow
                  id="GL-240421-011"
                  desc="Nước thải đen có mùi chảy ra cống"
                  type="Nước thải"
                  severity="Nghiêm trọng"
                  severityColor="text-red-500"
                  location="Q.1 • Bến Nghé"
                  status="Đã xác minh"
                  sla="04:22:09"
                  slaOverdue={false}
                />
                <QueueRow
                  id="GL-240420-089"
                  desc="Khói bụi dày tại công trình"
                  type="Khói bụi"
                  severity="Trung bình"
                  severityColor="text-amber-500"
                  location="Q.3 • P.6"
                  status="Đang xử lý"
                  sla="1 ngày"
                  slaOverdue={false}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Personal stats */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Hiệu suất cá nhân</h2>
          <div className="grid grid-cols-2 gap-3">
            <PerfCard label="Tỷ lệ resolved/closed" value="76%" />
            <PerfCard label="Báo cáo từ chối" value="18" />
            <PerfCard label="Trùng lặp đã gộp" value="23" />
            <PerfCard label="Override AI severity" value="12" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

interface StatCardProps {
  readonly label: string;
  readonly value: string;
  readonly tag: string;
  readonly tagColor: string;
  readonly icon: React.ReactNode;
}

function StatCard({ label, value, tag, tagColor, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/70 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        {icon}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        <span className={`mb-0.5 text-xs font-semibold ${tagColor}`}>{tag}</span>
      </div>
    </div>
  );
}

interface ProgressItemProps {
  readonly label: string;
  readonly percent: number;
  readonly color: string;
}

function ProgressItem({ label, percent, color }: ProgressItemProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-semibold text-gray-800">{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

interface HotspotItemProps {
  readonly dot: string;
  readonly name: string;
  readonly stats: string;
  readonly desc: string;
}

function HotspotItem({ dot, name, stats, desc }: HotspotItemProps) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`mt-1 size-2 shrink-0 rounded-full ${dot}`} />
      <div>
        <p className="text-xs font-medium text-gray-800">{name}</p>
        <p className="text-[11px] text-gray-500">
          {stats} • {desc}
        </p>
      </div>
    </div>
  );
}

interface AlertItemProps {
  readonly label: string;
  readonly badge: string;
  readonly badgeColor: string;
}

function AlertItem({ label, badge, badgeColor }: AlertItemProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
      <span className="text-xs text-gray-700">{label}</span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${badgeColor}`}
      >
        {badge}
      </span>
    </div>
  );
}

interface QueueRowProps {
  readonly id: string;
  readonly desc: string;
  readonly type: string;
  readonly severity: string;
  readonly severityColor: string;
  readonly location: string;
  readonly status: string;
  readonly sla: string;
  readonly slaOverdue: boolean;
}

function QueueRow({
  id,
  desc,
  type,
  severity,
  severityColor,
  location,
  status,
  sla,
  slaOverdue,
}: QueueRowProps) {
  return (
    <tr className="group hover:bg-gray-50">
      <td className="py-3 pr-4">
        <p className="font-medium text-gray-800">{id}</p>
        <p className="mt-0.5 text-gray-400">{desc}</p>
      </td>
      <td className="py-3 pr-4 text-gray-600">{type}</td>
      <td className={`py-3 pr-4 font-medium ${severityColor}`}>{severity}</td>
      <td className="py-3 pr-4 text-gray-500">{location}</td>
      <td className="py-3 pr-4">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{status}</span>
      </td>
      <td className={`py-3 font-mono font-medium ${slaOverdue ? 'text-red-500' : 'text-gray-700'}`}>
        {sla}
      </td>
    </tr>
  );
}

interface PerfCardProps {
  readonly label: string;
  readonly value: string;
}

function PerfCard({ label, value }: PerfCardProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
