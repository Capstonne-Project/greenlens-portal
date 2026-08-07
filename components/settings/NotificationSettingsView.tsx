'use client';

import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/useNotification';
import type { NotificationPreference } from '@/lib/api/models/notification';
import { cn } from '@/lib/utils';
import { getNotificationMutationError, notificationTypeLabel } from '@/utils/notificationUi';
import {
  AlarmClock,
  AlertTriangle,
  BadgeCheck,
  Bell,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ChevronDown,
  FileWarning,
  Globe,
  Gavel,
  Loader2,
  Mail,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Trophy,
  UserRoundPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

function clonePreferences(list: NotificationPreference[]): NotificationPreference[] {
  return list.map(p => ({ ...p }));
}

export function NotificationSettingsView() {
  const { data, isPending, isError, refetch } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const [draft, setDraft] = useState<NotificationPreference[]>([]);
  const [syncedData, setSyncedData] = useState<NotificationPreference[] | undefined>(undefined);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  if (data !== undefined && data !== syncedData) {
    setSyncedData(data);
    setDraft(clonePreferences(data));
    if (data.length > 0) {
      setExpandedType(prev => prev ?? data[0]!.type);
    }
  }

  const patchPref = (type: string, key: 'pushEnabled' | 'emailEnabled', value: boolean) => {
    if (updatePrefs.isPending) return;
    const prevDraft = draft;
    const nextDraft = prevDraft.map(p => (p.type === type ? { ...p, [key]: value } : p));
    setDraft(nextDraft);
    updatePrefs.mutate(
      { preferences: nextDraft },
      {
        onSuccess: () => {
          // Silent success: UX không spam toast khi user gạt nhiều switch liên tiếp.
        },
        onError: err => {
          setDraft(prevDraft);
          toast.error(getNotificationMutationError(err, 'Không thể cập nhật cài đặt'));
        },
      }
    );
  };

  const grouped = useMemo(() => {
    const items = draft.map(pref => ({
      ...pref,
      title: resolveTypeLabel(pref.type),
      description: resolveTypeDescription(pref.type),
      channelSummary: resolveChannelSummary(pref),
    }));
    items.sort((a, b) => getPreferenceOrder(a.type) - getPreferenceOrder(b.type));
    return items;
  }, [draft]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Cài đặt thông báo</h2>
        <p className="max-w-3xl text-lg leading-6 text-muted-foreground">
          Bật hoặc tắt thông báo theo từng loại qua thông báo đẩy và Email; một số thông báo hệ
          thống vẫn có thể hiển thị trong mục thông báo ở đây.
        </p>
      </header>

      <div className="space-y-3">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          Loại thông báo bạn nhận được
        </h3>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border py-20 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Đang tải cài đặt…
        </div>
      ) : isError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden />
          <div className="space-y-3">
            <p className="font-semibold text-destructive">Không tải được cài đặt thông báo</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted"
            >
              <RefreshCw className="size-4" aria-hidden />
              Thử lại
            </button>
          </div>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="py-2">
            {grouped.map(pref => {
              const open = expandedType === pref.type;
              return (
                <li key={pref.type} className="px-2">
                  <button
                    type="button"
                    onClick={() => setExpandedType(prev => (prev === pref.type ? null : pref.type))}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted/70"
                    aria-expanded={open}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center text-black">
                        {renderPreferenceIcon(pref.type)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-md font-semibold text-foreground">
                          {pref.title}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {pref.channelSummary}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        'size-5 shrink-0 text-muted-foreground transition-transform',
                        open && 'rotate-180'
                      )}
                      aria-hidden
                    />
                  </button>

                  {open ? (
                    <div className="px-2 pb-3">
                      <div className="pl-11">
                        <p className="py-3 text-base leading-6 text-foreground">
                          {pref.description}
                        </p>
                        <p className="pb-1 text-base font-semibold text-foreground">
                          Nơi bạn nhận những thông báo này
                        </p>
                      </div>

                      <div className="pl-11">
                        <SwitchRow
                          icon={<BellRing className="size-5 text-muted-foreground" aria-hidden />}
                          label="Thông báo đẩy"
                          checked={pref.pushEnabled}
                          disabled={updatePrefs.isPending}
                          onChange={v => patchPref(pref.type, 'pushEnabled', v)}
                        />
                        <SwitchRow
                          icon={<Mail className="size-5 text-muted-foreground" aria-hidden />}
                          label="Email"
                          checked={pref.emailEnabled}
                          disabled={updatePrefs.isPending}
                          onChange={v => patchPref(pref.type, 'emailEnabled', v)}
                        />
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function SwitchRow({
  icon,
  label,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center">{icon}</span>
        <span className="text-base font-semibold text-foreground">{label}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition',
          checked ? 'bg-emerald-600' : 'bg-muted',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition',
            checked && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}

function resolveChannelSummary(pref: NotificationPreference): string {
  const channels: string[] = [];
  if (pref.pushEnabled) channels.push('Thông báo đẩy');
  if (pref.emailEnabled) channels.push('Email');
  if (channels.length === 0) return 'Không nhận';
  return channels.join(', ');
}

function resolveTypeDescription(type: string): string {
  const byType: Record<string, string> = {
    ReportStatusChanged:
      'Nhận thông báo khi báo cáo của bạn được xác minh, từ chối hoặc cập nhật xử lý.',
    NewComment: 'Nhận thông báo khi có bình luận mới liên quan đến báo cáo của bạn.',
    BadgeEarned: 'Nhận thông báo khi bạn đạt huy hiệu mới từ hoạt động đóng góp.',
    LevelUp: 'Nhận thông báo khi điểm tích lũy giúp bạn lên cấp.',
    SlaBreachWarning: 'Nhận cảnh báo khi báo cáo vượt cam kết thời gian xử lý theo SLA.',
    NearbyReport: 'Nhận thông báo khi có báo cáo ô nhiễm mới trong khu vực lân cận.',
    PenaltyIssued: 'Nhận thông báo khi có quyết định xử phạt liên quan.',
    ContractExpiry: 'Nhận nhắc nhở khi hợp đồng dịch vụ môi trường sắp hoặc đã hết hạn.',
    ReportOverdue: 'Nhận cảnh báo khi báo cáo tồn đọng quá thời gian quy định (72 giờ).',
    ReportUnassigned:
      'Nhận thông báo khi báo cáo đã xác minh nhưng chưa được gán đội xử lý đúng hạn.',
    ReportAutoClosed:
      'Nhận thông báo khi hệ thống tự động đóng báo cáo sau thời gian chờ xác nhận.',
    DuplicateReviewNeeded: 'Nhận thông báo khi báo cáo được đưa vào hàng đợi xem xét trùng lặp.',
    SlaVerificationBreachedLeo: 'Nhận cảnh báo khi báo cáo vượt cam kết xác minh.',
    SlaVerificationEscalatedDeo:
      'Nhận thông báo khi báo cáo được chuyển cấp xử lý do vượt cam kết.',
    SlaResolutionBreached: 'Nhận cảnh báo khi báo cáo vượt cam kết xử lý.',
    SlaInspectionBreached: 'Nhận cảnh báo khi báo cáo vượt cam kết kiểm tra.',
    CleanupProgressStale: 'Thông báo khi tiến độ xử lý từ đội cleanup bị chậm hoặc đứng yên.',
    CleanupTaskAssigned: 'Thông báo khi có nhiệm vụ cleanup mới được gán.',
    ContractExpired: 'Thông báo khi hợp đồng đã hết hạn.',
    ContractExpiryWarning: 'Thông báo nhắc trước khi hợp đồng sắp hết hạn.',
    CompanyReportDispatched: 'Thông báo khi báo cáo được chuyển giao cho doanh nghiệp xử lý.',
    ReopenReviewNeeded: 'Thông báo khi có yêu cầu mở lại báo cáo cần xét duyệt.',
    ReopenRequestDecided: 'Thông báo kết quả duyệt/từ chối yêu cầu mở lại báo cáo.',
    ReportVerificationNeeded: 'Thông báo khi có báo cáo mới cần xác minh.',
    StaffInvitationReceived: 'Thông báo khi bạn nhận được lời mời tham gia ward team.',
    StaffInvitationAccepted: 'Thông báo khi lời mời của bạn được chấp nhận.',
    StaffInvitationDeclined: 'Thông báo khi lời mời của bạn bị từ chối.',
    CommunityCleanupOpened: 'Thông báo khi chương trình dọn cộng đồng mới được mở.',
    CommunityCleanupLeaderAssigned:
      'Thông báo khi bạn được chỉ định làm Leader chương trình dọn cộng đồng.',
    CommunityCleanupStarted: 'Thông báo khi Leader check-in và chương trình dọn cộng đồng bắt đầu.',
    CommunityCleanupProgressUpdated:
      'Thông báo khi Leader cập nhật tiến độ chương trình dọn cộng đồng.',
    CommunityCleanupVerificationSubmitted:
      'Thông báo khi Leader nộp minh chứng hoàn thành cần bạn duyệt.',
    CommunityCleanupVerificationRejected: 'Thông báo khi minh chứng hoàn thành bị từ chối.',
    CommunityCleanupVerified: 'Thông báo khi chương trình dọn cộng đồng được xác nhận hoàn thành.',
    CommunityCleanupCheckInReminder: 'Nhắc nhở check-in trước giờ dọn dẹp cộng đồng.',
    BadgeProgressNear: 'Thông báo khi bạn sắp đạt một huy hiệu mới.',
  };
  return byType[type] ?? 'Thông báo liên quan đến hoạt động tài khoản và nghiệp vụ xử lý báo cáo.';
}

function resolveTypeLabel(type: string): string {
  const byType: Record<string, string> = {
    ReportStatusChanged: 'Trạng thái báo cáo',
    NewComment: 'Bình luận mới',
    BadgeEarned: 'Huy hiệu mới',
    LevelUp: 'Lên cấp',
    SlaBreachWarning: 'Cảnh báo vượt cam kết xử lý',
    SlaVerificationBreachedLeo: 'Vượt cam kết xác minh',
    SlaVerificationEscalatedDeo: 'Chuyển cấp xử lý do vượt cam kết',
    SlaResolutionBreached: 'Vượt cam kết xử lý',
    SlaInspectionBreached: 'Vượt cam kết kiểm tra',
    NearbyReport: 'Báo cáo gần bạn',
    PenaltyIssued: 'Xử phạt',
    ContractExpiry: 'Hợp đồng sắp hết hạn',
    ReportOverdue: 'Báo cáo quá hạn',
    ReportUnassigned: 'Chưa phân công xử lý',
    ReportAutoClosed: 'Tự động đóng',
    DuplicateReviewNeeded: 'Cần xem xét trùng lặp',
    CommunityCleanupOpened: 'Dọn cộng đồng mở',
    CommunityCleanupLeaderAssigned: 'Được chỉ định làm Leader',
    CommunityCleanupStarted: 'Dọn cộng đồng bắt đầu',
    CommunityCleanupProgressUpdated: 'Cập nhật tiến độ dọn cộng đồng',
    CommunityCleanupVerificationSubmitted: 'Cần duyệt hoàn thành',
    CommunityCleanupVerificationRejected: 'Minh chứng bị từ chối',
    CommunityCleanupVerified: 'Dọn cộng đồng hoàn thành',
    CommunityCleanupCheckInReminder: 'Nhắc check-in',
    BadgeProgressNear: 'Sắp đạt huy hiệu',
  };
  return byType[type] ?? notificationTypeLabel(type);
}

function getPreferenceOrder(type: string): number {
  if (type === 'ReportStatusChanged') return 0;
  if (type === 'ReportVerificationNeeded') return 1;
  return 10;
}

function renderPreferenceIcon(type: string): React.ReactNode {
  const iconByType: Record<string, React.ComponentType<{ className?: string }>> = {
    ReportStatusChanged: ClipboardCheck,
    NewComment: Bell,
    BadgeEarned: Trophy,
    LevelUp: BadgeCheck,
    SlaBreachWarning: ShieldAlert,
    SlaVerificationBreachedLeo: ShieldAlert,
    SlaVerificationEscalatedDeo: ShieldAlert,
    SlaResolutionBreached: ShieldAlert,
    SlaInspectionBreached: ShieldAlert,
    NearbyReport: Globe,
    PenaltyIssued: Gavel,
    ContractExpiry: Clock3,
    ContractExpired: Clock3,
    ContractExpiryWarning: Clock3,
    CompanyReportDispatched: ClipboardCheck,
    ReportOverdue: FileWarning,
    ReportUnassigned: Users,
    ReportAutoClosed: ClipboardCheck,
    DuplicateReviewNeeded: ClipboardCheck,
    ReopenReviewNeeded: ClipboardCheck,
    ReopenRequestDecided: ClipboardCheck,
    ReportVerificationNeeded: ClipboardCheck,
    StaffInvitationReceived: UserRoundPlus,
    StaffInvitationAccepted: UserRoundPlus,
    StaffInvitationDeclined: UserRoundPlus,
    CleanupProgressStale: FileWarning,
    CleanupTaskAssigned: ClipboardCheck,
    CommunityCleanupOpened: Users,
    CommunityCleanupLeaderAssigned: UserRoundPlus,
    CommunityCleanupStarted: PlayCircle,
    CommunityCleanupProgressUpdated: TrendingUp,
    CommunityCleanupVerificationSubmitted: ClipboardCheck,
    CommunityCleanupVerificationRejected: XCircle,
    CommunityCleanupVerified: CheckCircle2,
    CommunityCleanupCheckInReminder: AlarmClock,
    BadgeProgressNear: Sparkles,
  };

  const Icon = iconByType[type];
  if (Icon) {
    return <Icon className="size-6" aria-hidden />;
  }
  return <BellRing className="size-6" aria-hidden />;
}
