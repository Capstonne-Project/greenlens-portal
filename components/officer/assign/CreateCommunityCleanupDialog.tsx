'use client';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UsersGroupIcon from '@/components/ui/users-group-icon';
import { MeetingPointMapPicker } from '@/components/officer/assign/MeetingPointMapPicker';
import { SuccessDialog } from '@/components/common/SuccessDialog';
import {
  CreateSuccessShareDialog,
  hasCommunityCleanupShare,
} from '@/components/officer/community/CreateSuccessShareDialog';
import { useCreateCommunityCleanup } from '@/hooks/useCommunityCleanup';
import {
  TEAMS_ASSIGN_PAGE_SIZE,
  teamKeys,
  useTeamDetail,
  useTeamsInfiniteList,
} from '@/hooks/useTeams';
import type { CommunityCleanupShare } from '@/lib/api/models/communityCleanup';
import type { TeamMember } from '@/lib/api/services/fetchTeam';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import { cn } from '@/lib/utils';
import { navigateAfterOverlayClose } from '@/lib/utils/radixUi';
import { stashCommunityCleanupFacebookPostHighlight } from '@/utils/communityCleanupFacebookPost';
import { useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CircleHelp,
  ClipboardList,
  HeartHandshake,
  Loader2,
  MapPin,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type UIEvent } from 'react';

export interface CreateCommunityCleanupDialogProps {
  open: boolean;
  onClose: () => void;
  reportId: string;
  reportCode: string;
  reportLatitude: number;
  reportLongitude: number;
  onCreated?: (eventId: string) => void;
}

const DEFAULT_MAX_PARTICIPANTS = 50;

/** Đóng đăng ký: trước giờ bắt đầu ≥ 1 phút, tối đa 24 giờ (cùng ngày hoặc ngày trước). */
const JOIN_CLOSE_MIN_LEAD_MS = 60 * 1000;
const JOIN_CLOSE_MAX_LEAD_MS = 24 * 60 * 60 * 1000;
const END_AFTER_START_MS = 60 * 1000;

function parseTimeMs(iso: string): number | null {
  if (!iso.trim()) return null;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function isJoinCloseInWindow(joinMs: number, startMs: number): boolean {
  const lead = startMs - joinMs;
  return lead >= JOIN_CLOSE_MIN_LEAD_MS && lead <= JOIN_CLOSE_MAX_LEAD_MS;
}

/** Mô tả mẫu — Tab khi ô trống để điền (thiện nguyện / công dân). */
const DESCRIPTION_TEMPLATE = [
  '• Nón, áo khoác hoặc găng tay chống nắng',
  '• 01 bộ đồ dự phòng (phòng trường hợp bị bẩn hoặc ướt)',
  '• Tinh thần thật “xanh” và năng lượng thật tích cực 💚',
].join('\n');

const TEXTAREA_CLASS =
  'mt-1.5 min-h-24 w-full resize-none rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10';

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <Label
      htmlFor={htmlFor}
      className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
    >
      {children}
    </Label>
  );
}

function FieldHint({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(prev => !prev);
          }}
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CircleHelp className="size-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="z-[110] max-w-64 text-left text-xs leading-relaxed"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        <Icon className="size-3.5" />
      </span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

function RadioRow({
  label,
  sublabel,
  checked,
  onSelect,
}: {
  label: string;
  sublabel?: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition',
        checked ? 'bg-emerald-50/70 dark:bg-emerald-500/10' : 'hover:bg-muted/40'
      )}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onSelect}
        className="size-3.5 shrink-0 accent-emerald-600"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        {sublabel ? (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sublabel}</p>
        ) : null}
      </div>
    </label>
  );
}

function ListShell({
  loading,
  emptyMessage,
  children,
  onScroll,
  footer,
}: {
  loading: boolean;
  emptyMessage: string;
  children: React.ReactNode;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
  footer?: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex h-28 items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Đang tải...
      </div>
    );
  }

  return (
    <div
      className="max-h-40 overflow-y-auto overscroll-contain rounded-lg border border-border bg-background"
      onScroll={onScroll}
    >
      {children ?? (
        <div className="flex h-28 items-center justify-center px-5 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
      {footer}
    </div>
  );
}

/** LEO mở chương trình dọn cộng đồng trên 1 báo cáo Verified — thay thế Phân công/Điều phối. */
export function CreateCommunityCleanupDialog({
  open,
  onClose,
  reportId,
  reportCode,
  reportLatitude,
  reportLongitude,
  onCreated,
}: CreateCommunityCleanupDialogProps) {
  const createMutation = useCreateCommunityCleanup();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [leaderUserId, setLeaderUserId] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [joinClosesAt, setJoinClosesAt] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(String(DEFAULT_MAX_PARTICIPANTS));
  const [meetingNote, setMeetingNote] = useState('');
  const [meetingLat, setMeetingLat] = useState(reportLatitude);
  const [meetingLng, setMeetingLng] = useState(reportLongitude);
  const [formKey, setFormKey] = useState(0);
  const [createdEvent, setCreatedEvent] = useState<{
    id: string;
    title: string;
    share: CommunityCleanupShare;
    thumbnailUrl: string | null;
    description: string | null;
    meetingNote: string | null;
    reportAddress: string | null;
    startsAt: string;
    endsAt: string | null;
  } | null>(null);
  const [fbPostSuccessOpen, setFbPostSuccessOpen] = useState(false);
  const [fbPostEventId, setFbPostEventId] = useState<string | null>(null);
  const shareFlowRef = useRef(false);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setTeamId(null);
    setLeaderUserId(null);
    setStartsAt('');
    setEndsAt('');
    setJoinClosesAt('');
    setMaxParticipants(String(DEFAULT_MAX_PARTICIPANTS));
    setMeetingNote('');
    setMeetingLat(reportLatitude);
    setMeetingLng(reportLongitude);
    setFormKey(k => k + 1);
  }, [reportLatitude, reportLongitude]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Re-centre the meeting point on the report's own location each time the dialog
  // opens for a (possibly different) report — set during render, not in an effect,
  // per the React-recommended pattern for reacting to a prop transition.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMeetingLat(reportLatitude);
      setMeetingLng(reportLongitude);
    }
  }

  const {
    data: teamsPages,
    isPending: teamsLoading,
    isFetchingNextPage: teamsFetchingNext,
    hasNextPage: teamsHasNext,
    fetchNextPage: fetchNextTeams,
  } = useTeamsInfiniteList(
    { pageSize: TEAMS_ASSIGN_PAGE_SIZE, teamType: 'Cleanup', isActive: true },
    { enabled: open }
  );

  // Chỉ đội cộng đồng (LEO-managed, gắn LocalOffice) — loại đội công ty (officeName null)
  // vì Leader chương trình cộng đồng không thể là team công ty DVMT.
  const teams = useMemo(
    () => (teamsPages?.pages.flatMap(page => page.items) ?? []).filter(t => t.officeName != null),
    [teamsPages?.pages]
  );

  const { data: teamDetail, isFetching: membersLoading } = useTeamDetail(teamId);
  const members: TeamMember[] = teamDetail?.members ?? [];

  const handleTeamsScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const el = event.currentTarget;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
      if (nearBottom && teamsHasNext && !teamsFetchingNext) void fetchNextTeams();
    },
    [teamsHasNext, teamsFetchingNext, fetchNextTeams]
  );

  const selectTeam = (id: string) => {
    if (id === teamId) return;
    setTeamId(id);
    setLeaderUserId(null);
    // Membership thay đổi qua flow accept-invitation (mobile) không invalidate
    // cache của portal — luôn lấy dữ liệu mới nhất khi LEO chọn team ở đây,
    // tránh hiển thị "chưa có thành viên" do cache cũ còn hạn (staleTime 3').
    void queryClient.invalidateQueries({ queryKey: teamKeys.detail(id) });
  };

  const isSubmitting = createMutation.isPending;

  const startMs = parseTimeMs(startsAt);
  const joinCloseMs = parseTimeMs(joinClosesAt);
  const endMs = parseTimeMs(endsAt);

  const joinCloseMinDate = startMs != null ? new Date(startMs - JOIN_CLOSE_MAX_LEAD_MS) : undefined;
  const joinCloseMaxDate = startMs != null ? new Date(startMs - JOIN_CLOSE_MIN_LEAD_MS) : undefined;
  const endsMinDate = startMs != null ? new Date(startMs + END_AFTER_START_MS) : undefined;

  const joinCloseError =
    joinCloseMs != null && startMs != null && !isJoinCloseInWindow(joinCloseMs, startMs)
      ? 'Đóng đăng ký phải trước giờ bắt đầu dọn ít nhất 1 phút và không quá 24 giờ.'
      : undefined;
  const endsError =
    endMs != null && startMs != null && endMs <= startMs
      ? 'Giờ kết thúc phải sau giờ bắt đầu dọn.'
      : endMs != null && joinCloseMs != null && endMs <= joinCloseMs
        ? 'Giờ kết thúc phải sau giờ đóng đăng ký.'
        : undefined;

  const canSubmit =
    title.trim().length > 0 &&
    Boolean(leaderUserId) &&
    Boolean(startsAt) &&
    !joinCloseError &&
    !endsError &&
    !isSubmitting;

  const handleStartsAtChange = (iso: string) => {
    setStartsAt(iso);
    const nextStart = parseTimeMs(iso);
    if (nextStart == null) return;
    const joinMs = parseTimeMs(joinClosesAt);
    if (joinMs != null && !isJoinCloseInWindow(joinMs, nextStart)) setJoinClosesAt('');
    const nextEnd = parseTimeMs(endsAt);
    if (nextEnd != null && nextEnd <= nextStart) setEndsAt('');
  };

  const handleSubmit = async () => {
    if (!canSubmit || !leaderUserId || !startsAt) return;

    try {
      const envelope = await createMutation.mutateAsync({
        reportId,
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          leaderUserId,
          startsAt,
          endsAt: endsAt || undefined,
          joinClosesAt: joinClosesAt || undefined,
          maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
          meetingNote: meetingNote.trim() || undefined,
          meetingLatitude: meetingLat,
          meetingLongitude: meetingLng,
        },
      });
      const data = envelope.data;
      const eventId = data?.id?.trim();
      toastApiSuccess(null, `Đã mở chương trình dọn cộng đồng cho báo cáo ${reportCode}.`);

      if (eventId && data && hasCommunityCleanupShare(data.share)) {
        shareFlowRef.current = true;
        resetForm();
        setCreatedEvent({
          id: eventId,
          title: data.title,
          share: data.share,
          thumbnailUrl: data.thumbnailUrl,
          description: data.description,
          meetingNote: data.meetingNote,
          reportAddress: data.reportAddress,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
        });
        return;
      }

      if (eventId) onCreated?.(eventId);
      else onCreated?.('');
      handleClose();
      if (eventId) {
        navigateAfterOverlayClose(() => {
          router.push(`/officer/community/${encodeURIComponent(eventId)}`);
        });
      }
    } catch (err) {
      toastApiError(err, 'Không thể mở chương trình dọn cộng đồng. Vui lòng thử lại.');
    }
  };

  const selectedLeaderName = members.find(m => m.userId === leaderUserId)?.fullName;

  const finalizeCreateFlow = (options?: { navigateToDetail?: boolean; eventId?: string }) => {
    const eventId = (options?.eventId ?? createdEvent?.id ?? fbPostEventId)?.trim() ?? '';
    shareFlowRef.current = false;
    setCreatedEvent(null);
    setFbPostSuccessOpen(false);
    setFbPostEventId(null);
    if (eventId) onCreated?.(eventId);
    else onCreated?.('');
    onClose();
    if (options?.navigateToDetail && eventId) {
      navigateAfterOverlayClose(() => {
        router.push(`/officer/community/${encodeURIComponent(eventId)}`);
      });
    }
  };

  const handleShareDialogClose = () => {
    finalizeCreateFlow({ navigateToDetail: false });
  };

  const handleShareViewDetail = () => {
    finalizeCreateFlow({ navigateToDetail: true });
  };

  const handleFacebookShareSuccess = () => {
    const eventId = createdEvent?.id?.trim() ?? '';
    if (eventId) {
      stashCommunityCleanupFacebookPostHighlight(eventId);
    }
    shareFlowRef.current = true;
    setCreatedEvent(null);
    setFbPostEventId(eventId || null);
    setFbPostSuccessOpen(true);
  };

  return (
    <>
      <Dialog
        open={open && createdEvent == null && !fbPostSuccessOpen}
        onOpenChange={nextOpen => {
          if (!nextOpen && !isSubmitting && !shareFlowRef.current) handleClose();
        }}
      >
        <DialogContent
          className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
          onInteractOutside={e => {
            if (isSubmitting) e.preventDefault();
          }}
          onEscapeKeyDown={e => {
            if (isSubmitting) e.preventDefault();
          }}
        >
          <DialogHeader className="shrink-0 space-y-2 border-b border-border bg-linear-to-b from-emerald-50/60 to-transparent px-8 pb-4 pt-7 pr-14 text-left dark:from-emerald-500/5">
            <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <HeartHandshake className="size-4" aria-hidden />
              </span>
              Mở chương trình dọn cộng đồng
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              Báo cáo <span className="font-medium text-foreground">{reportCode}</span> chuyển sang{' '}
              <span className="font-medium text-foreground">Đang xử lý</span>. Citizen có thể tham
              gia (vote) ngay khi mở đăng ký — thay thế Phân công đội / Điều phối công ty cho báo
              cáo này.
            </DialogDescription>
          </DialogHeader>

          <div key={formKey} className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
            <div className="space-y-6">
              {/* Thông tin chương trình */}
              <section className="space-y-3">
                <SectionHeading icon={ClipboardList} title="Thông tin chương trình" />
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <FieldLabel htmlFor="cc-title">Tên chương trình</FieldLabel>
                    <Input
                      id="cc-title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Dọn rác kênh Nhiêu Lộc — Cộng đồng"
                      maxLength={200}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <FieldLabel htmlFor="cc-description">Mô tả (tuỳ chọn)</FieldLabel>
                      {!description.trim() ? (
                        <span className="text-[11px] text-muted-foreground">Tab để dùng mẫu</span>
                      ) : null}
                    </div>
                    <textarea
                      id="cc-description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                        if (event.key !== 'Tab' || event.shiftKey) return;
                        if (description.trim()) return;
                        event.preventDefault();
                        setDescription(DESCRIPTION_TEMPLATE);
                      }}
                      rows={4}
                      placeholder={DESCRIPTION_TEMPLATE}
                      className={TEXTAREA_CLASS}
                    />
                  </div>
                </div>
              </section>

              <div className="h-px bg-border" />

              {/* Đội & Leader */}
              <section className="space-y-3">
                <SectionHeading icon={Users} title="Đội dọn dẹp & Leader" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Đội dọn dẹp</FieldLabel>
                    <div className="mt-1.5">
                      <ListShell
                        loading={teamsLoading}
                        emptyMessage="Không có đội dọn dẹp cộng đồng."
                        onScroll={handleTeamsScroll}
                        footer={
                          teamsFetchingNext ? (
                            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                              <Loader2 className="size-3.5 animate-spin" />
                              Đang tải thêm...
                            </div>
                          ) : null
                        }
                      >
                        {teams.length > 0 ? (
                          <ul className="divide-y divide-border">
                            {teams.map(team => (
                              <li key={team.id}>
                                <RadioRow
                                  label={team.name}
                                  sublabel={`${team.officeName} · ${team.memberCount} thành viên`}
                                  checked={teamId === team.id}
                                  onSelect={() => selectTeam(team.id)}
                                />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </ListShell>
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Leader (Cleaner được chỉ định)</FieldLabel>
                    <div className="mt-1.5">
                      {!teamId ? (
                        <div className="flex h-full min-h-31 items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
                          <UsersGroupIcon size={14} className="text-muted-foreground" />
                          Chọn đội dọn dẹp trước
                        </div>
                      ) : (
                        <ListShell
                          loading={membersLoading}
                          emptyMessage="Đội này chưa có thành viên."
                        >
                          {members.length > 0 ? (
                            <ul className="divide-y divide-border">
                              {members.map(member => (
                                <li key={member.userId}>
                                  <RadioRow
                                    label={member.fullName}
                                    sublabel={member.email}
                                    checked={leaderUserId === member.userId}
                                    onSelect={() => setLeaderUserId(member.userId)}
                                  />
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </ListShell>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px bg-border" />

              {/* Thời gian */}
              <section className="space-y-3">
                <SectionHeading icon={CalendarClock} title="Thời gian" />
                <TooltipProvider delayDuration={0}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <FieldLabel htmlFor="cc-starts">Bắt đầu dọn</FieldLabel>
                        <FieldHint label="Giải thích giờ bắt đầu dọn">
                          Mốc gốc của chương trình. Giờ đóng đăng ký và giờ kết thúc đều neo theo
                          mốc này.
                        </FieldHint>
                      </div>
                      <div className="mt-1.5">
                        <DateTimePicker
                          id="cc-starts"
                          value={startsAt}
                          onChange={handleStartsAtChange}
                          placeholder="Chọn ngày giờ bắt đầu"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex min-h-4 items-center gap-1.5">
                        <FieldLabel htmlFor="cc-max">Số người tối đa</FieldLabel>
                      </div>
                      <div className="mt-1.5">
                        <Input
                          id="cc-max"
                          type="number"
                          min={1}
                          max={200}
                          value={maxParticipants}
                          onChange={e => setMaxParticipants(e.target.value)}
                          className="h-10 rounded-lg py-0 text-sm leading-none"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <FieldLabel htmlFor="cc-ends">Kết thúc (tuỳ chọn)</FieldLabel>
                        <FieldHint label="Giải thích giờ kết thúc">
                          Phải sau giờ bắt đầu dọn ít nhất 1 phút. Nếu đã chọn đóng đăng ký, giờ kết
                          thúc cũng phải sau giờ đóng đăng ký. Không chọn trước hoặc trùng giờ bắt
                          đầu.
                        </FieldHint>
                      </div>
                      <div className="mt-1.5">
                        <DateTimePicker
                          id="cc-ends"
                          value={endsAt}
                          onChange={setEndsAt}
                          placeholder="Chọn ngày giờ kết thúc"
                          minDate={endsMinDate}
                          clearable
                        />
                        {endsError ? (
                          <p className="mt-1.5 text-[11px] text-destructive">{endsError}</p>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <FieldLabel htmlFor="cc-join-closes">
                          Đóng đăng ký lúc (tuỳ chọn)
                        </FieldLabel>
                        <FieldHint label="Giải thích giờ đóng đăng ký">
                          Cùng ngày hoặc ngày trước giờ bắt đầu dọn. Phải trước giờ bắt đầu ít nhất
                          1 phút, tối đa 24 giờ — không trùng và không sau giờ dọn.
                        </FieldHint>
                      </div>
                      <div className="mt-1.5">
                        <DateTimePicker
                          id="cc-join-closes"
                          value={joinClosesAt}
                          onChange={setJoinClosesAt}
                          placeholder="Chọn ngày giờ đóng đăng ký"
                          minDate={joinCloseMinDate}
                          maxDate={joinCloseMaxDate}
                          clearable
                        />
                        {joinCloseError ? (
                          <p className="mt-1.5 text-[11px] text-destructive">{joinCloseError}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </TooltipProvider>
              </section>

              <div className="h-px bg-border" />

              {/* Điểm tập trung */}
              <section className="space-y-3">
                <SectionHeading icon={MapPin} title="Điểm tập trung" />
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <FieldLabel htmlFor="cc-meeting-note">
                      Ghi chú điểm tập trung (tuỳ chọn)
                    </FieldLabel>
                    <Input
                      id="cc-meeting-note"
                      value={meetingNote}
                      onChange={e => setMeetingNote(e.target.value)}
                      placeholder="Cổng công viên 23/9"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <MeetingPointMapPicker
                      latitude={meetingLat}
                      longitude={meetingLng}
                      onChange={(lat, lng) => {
                        setMeetingLat(lat);
                        setMeetingLng(lng);
                      }}
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-row items-center justify-between gap-3 border-t border-border bg-muted/20 px-8 py-4 sm:justify-between sm:space-x-0">
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {selectedLeaderName ? (
                <>
                  Leader: <span className="font-medium text-foreground">{selectedLeaderName}</span>
                </>
              ) : (
                'Chưa chọn leader'
              )}
            </p>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Huỷ
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={!canSubmit}
                className="bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <HeartHandshake className="mr-1.5 size-3.5" aria-hidden />
                )}
                {isSubmitting ? 'Đang mở...' : 'Mở chương trình'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {createdEvent ? (
        <CreateSuccessShareDialog
          open
          onClose={handleShareDialogClose}
          eventId={createdEvent.id}
          title={createdEvent.title}
          share={createdEvent.share}
          thumbnailUrl={createdEvent.thumbnailUrl}
          description={createdEvent.description}
          meetingNote={createdEvent.meetingNote}
          reportAddress={createdEvent.reportAddress}
          startsAt={createdEvent.startsAt}
          endsAt={createdEvent.endsAt}
          footerVariant="create"
          onViewDetail={handleShareViewDetail}
          onFacebookShareSuccess={handleFacebookShareSuccess}
        />
      ) : null}

      <SuccessDialog
        open={fbPostSuccessOpen}
        onOpenChange={next => {
          if (!next)
            finalizeCreateFlow({ navigateToDetail: false, eventId: fbPostEventId ?? undefined });
        }}
        accent="emerald"
        title="Đăng bài thành công"
        description="Chương trình đã được đăng lên Facebook Page."
        secondaryAction={{
          label: 'Đóng',
          onClick: () =>
            finalizeCreateFlow({ navigateToDetail: false, eventId: fbPostEventId ?? undefined }),
        }}
        primaryAction={{
          label: 'Xem chi tiết',
          onClick: () =>
            finalizeCreateFlow({ navigateToDetail: true, eventId: fbPostEventId ?? undefined }),
        }}
      />
    </>
  );
}
