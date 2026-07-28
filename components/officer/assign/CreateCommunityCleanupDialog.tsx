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
import UsersGroupIcon from '@/components/ui/users-group-icon';
import { MeetingPointMapPicker } from '@/components/officer/assign/MeetingPointMapPicker';
import { useCreateCommunityCleanup } from '@/hooks/useCommunityCleanup';
import {
  TEAMS_ASSIGN_PAGE_SIZE,
  teamKeys,
  useTeamDetail,
  useTeamsInfiniteList,
} from '@/hooks/useTeams';
import type { TeamMember } from '@/lib/api/services/fetchTeam';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { HeartHandshake, Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState, type UIEvent } from 'react';

export interface CreateCommunityCleanupDialogProps {
  open: boolean;
  onClose: () => void;
  reportId: string;
  reportCode: string;
  reportLatitude: number;
  reportLongitude: number;
  onCreated?: () => void;
}

const DEFAULT_MAX_PARTICIPANTS = 50;

const TEXTAREA_CLASS =
  'mt-1.5 h-18 w-full resize-none rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10';

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
        checked ? 'bg-muted/70' : 'hover:bg-muted/40'
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

  const canSubmit =
    title.trim().length > 0 && Boolean(leaderUserId) && Boolean(startsAt) && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !leaderUserId || !startsAt) return;

    try {
      await createMutation.mutateAsync({
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
      toastApiSuccess(null, `Đã mở chương trình dọn cộng đồng cho báo cáo ${reportCode}.`);
      onCreated?.();
      handleClose();
    } catch (err) {
      toastApiError(err, 'Không thể mở chương trình dọn cộng đồng. Vui lòng thử lại.');
    }
  };

  const selectedLeaderName = members.find(m => m.userId === leaderUserId)?.fullName;

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen && !isSubmitting) handleClose();
      }}
    >
      <DialogContent
        className="flex h-auto max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        onInteractOutside={e => {
          if (isSubmitting) e.preventDefault();
        }}
        onEscapeKeyDown={e => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border px-8 pb-4 pt-7 pr-14 text-left">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground">
            <HeartHandshake className="size-4 shrink-0 text-foreground" aria-hidden />
            Mở chương trình dọn cộng đồng
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Báo cáo <span className="font-medium text-foreground">{reportCode}</span> chuyển sang{' '}
            <span className="font-medium text-foreground">Đang xử lý</span>. Citizen có thể tham gia
            (vote) ngay khi mở đăng ký — thay thế Phân công đội / Điều phối công ty cho báo cáo này.
          </DialogDescription>
        </DialogHeader>

        <div key={formKey} className="max-h-[62vh] shrink-0 overflow-y-auto px-8 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
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

            <div className="sm:col-span-2">
              <FieldLabel htmlFor="cc-description">Mô tả (tuỳ chọn)</FieldLabel>
              <textarea
                id="cc-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Mang găng tay, nước uống. Tập trung cổng công viên."
                className={TEXTAREA_CLASS}
              />
            </div>

            <div className="sm:col-span-2">
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

            <div className="sm:col-span-2">
              <FieldLabel>Leader (Cleaner được chỉ định)</FieldLabel>
              <div className="mt-1.5">
                {!teamId ? (
                  <div className="flex h-16 items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                    <UsersGroupIcon size={14} className="text-muted-foreground" />
                    Chọn đội dọn dẹp trước
                  </div>
                ) : (
                  <ListShell loading={membersLoading} emptyMessage="Đội này chưa có thành viên.">
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

            <div>
              <FieldLabel htmlFor="cc-starts">Bắt đầu dọn</FieldLabel>
              <div className="mt-1.5">
                <DateTimePicker
                  id="cc-starts"
                  value={startsAt}
                  onChange={setStartsAt}
                  placeholder="Chọn ngày giờ bắt đầu"
                />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="cc-ends">Kết thúc (tuỳ chọn)</FieldLabel>
              <div className="mt-1.5">
                <DateTimePicker
                  id="cc-ends"
                  value={endsAt}
                  onChange={setEndsAt}
                  placeholder="Chọn ngày giờ kết thúc"
                  clearable
                />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="cc-join-closes">Đóng đăng ký lúc (tuỳ chọn)</FieldLabel>
              <div className="mt-1.5">
                <DateTimePicker
                  id="cc-join-closes"
                  value={joinClosesAt}
                  onChange={setJoinClosesAt}
                  placeholder="Chọn ngày giờ đóng đăng ký"
                  clearable
                />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="cc-max">Số người tối đa</FieldLabel>
              <Input
                id="cc-max"
                type="number"
                min={1}
                max={200}
                value={maxParticipants}
                onChange={e => setMaxParticipants(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel htmlFor="cc-meeting-note">Ghi chú điểm tập trung (tuỳ chọn)</FieldLabel>
              <Input
                id="cc-meeting-note"
                value={meetingNote}
                onChange={e => setMeetingNote(e.target.value)}
                placeholder="Cổng công viên 23/9"
                className="mt-1.5"
              />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Điểm tập trung trên bản đồ</FieldLabel>
              <div className="mt-1.5">
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
  );
}
