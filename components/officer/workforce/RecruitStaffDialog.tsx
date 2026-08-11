'use client';

import { getInitials, TYPE_LABEL } from '@/components/officer/workforce/teamTab/teamTab.shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useOfficeStaffLookup, useRecruitOfficeStaff } from '@/hooks/useLeoOffices';
import { useTeamDetail, useTeamsList } from '@/hooks/useTeams';
import type {
  OfficeStaffLookupResult,
  RecruitOfficeStaffInput,
  RecruitStaffTargetRole,
} from '@/lib/api/models/office';
import type { TeamListItem, TeamType } from '@/lib/api/models/team';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import { cn } from '@/lib/utils';
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { Leaf, Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

/** Nhãn VI — khớp MembersTab ROLE_BADGE (không kèm Cleaner/Inspector). */
const TARGET_ROLE_OPTIONS: { value: RecruitStaffTargetRole; label: string }[] = [
  { value: 'Cleaner', label: 'Đội dọn dẹp' },
  { value: 'Inspector', label: 'Thanh tra' },
];

/** Khoảng cách trigger → menu. */
const SELECT_MENU_OFFSET = 10;
const SELECT_COLLISION_PADDING = 24;

const NO_TEAM_VALUE = '__none__';

const TEAM_TYPE_BADGE_CLASS: Record<string, string> = {
  Cleanup: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  Inspection: 'bg-sky-50 text-sky-800 ring-sky-200/80',
  Response: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  Monitoring: 'bg-violet-50 text-violet-800 ring-violet-200/80',
  Survey: 'bg-purple-50 text-purple-800 ring-purple-200/80',
};

const recruitStaffSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  targetRole: z.enum(['Cleaner', 'Inspector'], {
    message: 'Vui lòng chọn vai trò',
  }),
  teamId: z.string().optional(),
  isLeader: z.boolean().optional(),
});

type RecruitStaffFormValues = z.infer<typeof recruitStaffSchema>;

const RECRUIT_TEAM_LIST_PARAMS = { page: 1, pageSize: 10 } as const;

const EMAIL_LOOKUP_SCHEMA = z.string().trim().email();

/** Spinner GreenLens — lá trong vòng quay xanh (thay Octocat GitHub). */
function GreenLensLookupSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn('relative inline-flex size-5 shrink-0 items-center justify-center', className)}
      aria-hidden
    >
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
      <Leaf className="size-2.5 text-emerald-600" strokeWidth={2.5} />
    </span>
  );
}

/** BE `currentStatus` → nhãn VI ngắn — parity CreateInspectionReportDialog. */
function teamStatusLabelVi(currentStatus: string): string {
  const key = currentStatus.trim().toLowerCase();
  if (key === 'available') return 'Sẵn sàng';
  if (key === 'busy') return 'Đang xử lý';
  return currentStatus.trim() || '—';
}

function TeamTypeBadge({ teamType }: { teamType: TeamType }) {
  const label = TYPE_LABEL[teamType] ?? teamType;
  return (
    <span
      className={cn(
        'inline-flex max-w-[4.5rem] shrink-0 items-center truncate rounded-full px-1.5 py-px',
        'text-[9px] font-semibold leading-tight ring-1 ring-inset',
        TEAM_TYPE_BADGE_CLASS[teamType] ?? 'bg-slate-50 text-slate-600 ring-slate-200/80'
      )}
      title={label}
    >
      {label}
    </span>
  );
}

function TeamSelectRow({
  team,
  className,
  compact = false,
}: {
  team: TeamListItem;
  className?: string;
  /** Trigger đã chọn: avatar + tên kèm badge sát tên. */
  compact?: boolean;
}) {
  const statusLabel = teamStatusLabelVi(team.currentStatus);

  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-2.5', className)}>
      <Avatar className="size-7 shrink-0">
        <AvatarFallback className="bg-sky-100 text-[10px] font-semibold text-sky-800">
          {getInitials(team.name) || 'Đ'}
        </AvatarFallback>
      </Avatar>
      {compact ? (
        <span className="flex min-w-0 flex-1 items-center gap-1">
          <span className="min-w-0 truncate text-sm font-semibold text-foreground">
            {team.name}
          </span>
          <TeamTypeBadge teamType={team.teamType} />
        </span>
      ) : (
        <span className="min-w-0 flex-1 text-left leading-tight">
          <span className="flex min-w-0 items-center gap-1">
            <span className="min-w-0 truncate text-sm font-semibold text-foreground">
              {team.name}
            </span>
            <TeamTypeBadge teamType={team.teamType} />
          </span>
          <span className="mt-1.5 flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
            <span className="truncate">{statusLabel}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0">{team.memberCount} thành viên</span>
          </span>
        </span>
      )}
    </div>
  );
}

function LookupResultRow({
  user,
  onInvite,
}: {
  user: OfficeStaffLookupResult;
  onInvite: (user: OfficeStaffLookupResult) => void;
}) {
  const eligible = user.isRecruitEligible;
  const displayName = user.fullName?.trim() || user.email;
  const initials = getInitials(displayName) || 'U';

  return (
    <button
      type="button"
      disabled={!eligible}
      onMouseDown={e => e.preventDefault()}
      onClick={() => {
        if (eligible) onInvite(user);
      }}
      className={cn(
        'flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors',
        eligible
          ? 'cursor-pointer hover:bg-muted/80 focus-visible:bg-muted/80 focus-visible:outline-none'
          : 'cursor-not-allowed opacity-60'
      )}
    >
      <Avatar className="size-9 shrink-0">
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
        <AvatarFallback className="bg-emerald-100 text-xs font-semibold text-emerald-800">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 leading-snug">
        <span className="block truncate text-sm font-semibold text-foreground">{displayName}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="min-w-0 truncate">{user.email}</span>
          <span aria-hidden>·</span>
          <span className={cn('shrink-0', eligible ? 'text-emerald-700' : 'text-muted-foreground')}>
            {eligible ? 'Mời tham gia' : 'Không đủ điều kiện'}
          </span>
        </span>
        {!eligible && user.ineligibleReason ? (
          <span className="mt-1 block text-[11px] text-amber-700">{user.ineligibleReason}</span>
        ) : null}
      </span>
    </button>
  );
}

interface RecruitStaffDialogProps {
  open: boolean;
  onClose: () => void;
  onRecruited?: () => void;
}

export function RecruitStaffDialog({ open, onClose, onRecruited }: RecruitStaffDialogProps) {
  const recruitMutation = useRecruitOfficeStaff();
  const { data: teamsData, isPending: teamsLoading } = useTeamsList(RECRUIT_TEAM_LIST_PARAMS, {
    enabled: open,
  });
  const teams = teamsData?.items ?? [];

  const [emailFocused, setEmailFocused] = useState(false);
  const [lookupPicked, setLookupPicked] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecruitStaffFormValues>({
    resolver: zodResolver(recruitStaffSchema),
    defaultValues: {
      email: '',
      targetRole: 'Cleaner',
      teamId: '',
      isLeader: false,
    },
  });

  const emailRegister = register('email');
  const emailValue = watch('email');
  const debouncedEmail = useDebouncedValue(emailValue?.trim() ?? '', SEARCH_DEBOUNCE_MS);
  const isLookupEmailValid = EMAIL_LOOKUP_SCHEMA.safeParse(debouncedEmail).success;

  const lookupQuery = useOfficeStaffLookup(debouncedEmail, {
    enabled: open && isLookupEmailValid && !lookupPicked,
  });

  const selectedTeamId = watch('teamId');
  const trimmedTeamId = selectedTeamId?.trim() || '';
  const hasTeam = Boolean(trimmedTeamId);
  const selectedTeam = useMemo(
    () => teams.find(t => t.id === selectedTeamId) ?? null,
    [teams, selectedTeamId]
  );
  /** GET /v1/teams/{id} — kiểm tra members[].isLeader khi đã chọn đội. */
  const { data: selectedTeamDetail, isPending: teamDetailLoading } = useTeamDetail(
    open && trimmedTeamId ? trimmedTeamId : null
  );
  const teamHasLeader = useMemo(
    () => (selectedTeamDetail?.members ?? []).some(m => m.isLeader),
    [selectedTeamDetail?.members]
  );
  const isBusy = recruitMutation.isPending;

  const showLookupMenu =
    emailFocused &&
    isLookupEmailValid &&
    !lookupPicked &&
    (lookupQuery.isFetching || lookupQuery.isSuccess || lookupQuery.isError);

  useEffect(() => {
    if (!open) {
      reset({
        email: '',
        targetRole: 'Cleaner',
        teamId: '',
        isLeader: false,
      });
      setEmailFocused(false);
      setLookupPicked(false);
    }
  }, [open, reset]);

  useEffect(() => {
    if (teamHasLeader || !hasTeam) {
      setValue('isLeader', false);
    }
  }, [teamHasLeader, hasTeam, setValue]);

  const handlePickLookup = (user: OfficeStaffLookupResult) => {
    setLookupPicked(true);
    setEmailFocused(false);
    setValue('email', user.email, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = handleSubmit(async values => {
    const teamId = values.teamId?.trim() || null;
    const payload: RecruitOfficeStaffInput = {
      email: values.email.trim(),
      targetRole: values.targetRole,
      teamId,
      isLeader: teamId ? (teamHasLeader ? false : Boolean(values.isLeader)) : false,
    };

    try {
      const res = await recruitMutation.mutateAsync(payload);
      toastApiSuccess(
        res,
        teamId
          ? `Đã thêm ${res.data.fullName || values.email} vào đội xử lý.`
          : `Đã thêm ${res.data.fullName || values.email} vào văn phòng.`
      );
      onRecruited?.();
      onClose();
    } catch (err) {
      toastApiError(err, 'Không thể thêm thành viên. Vui lòng thử lại.');
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen && !isBusy) onClose();
      }}
    >
      <DialogContent
        className="gap-0 overflow-visible p-0 sm:max-w-md"
        onInteractOutside={e => {
          if (isBusy) e.preventDefault();
        }}
        onEscapeKeyDown={e => {
          if (isBusy) e.preventDefault();
        }}
      >
        <form onSubmit={onSubmit} className="flex flex-col overflow-visible">
          <div className="space-y-4 overflow-visible p-6 pb-8 md:p-8 md:pb-10">
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="flex items-center gap-2.5">
                <FontAwesomeIcon
                  icon={faUser}
                  className="size-4 shrink-0 text-foreground"
                  aria-hidden
                />
                Thêm thành viên
              </DialogTitle>
              <DialogDescription>Tuyển công dân vào văn phòng và đội xử lý</DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <div className="space-y-1">
                  <Label htmlFor="recruit-email">Tìm theo email công dân</Label>
                  {!errors.email ? (
                    <FieldDescription>
                      Nhập email chính xác để xem trước rồi mời tham gia
                    </FieldDescription>
                  ) : null}
                </div>
                <div className="relative">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="recruit-email"
                      type="email"
                      autoComplete="off"
                      placeholder="Tìm người dùng"
                      autoFocus
                      className="pl-9 pr-10"
                      {...emailRegister}
                      onFocus={() => {
                        setEmailFocused(true);
                      }}
                      onBlur={e => {
                        emailRegister.onBlur(e);
                        // Delay để click dropdown kịp fire trước khi đóng.
                        window.setTimeout(() => setEmailFocused(false), 120);
                      }}
                      onChange={e => {
                        setLookupPicked(false);
                        void emailRegister.onChange(e);
                      }}
                    />
                    {lookupQuery.isFetching && isLookupEmailValid && !lookupPicked ? (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <GreenLensLookupSpinner />
                        <span className="sr-only">Đang tìm…</span>
                      </span>
                    ) : null}
                  </div>

                  {showLookupMenu ? (
                    <div
                      role="listbox"
                      aria-label="Kết quả tìm kiếm"
                      className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
                    >
                      {lookupQuery.isFetching ? (
                        <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                          <GreenLensLookupSpinner />
                          Đang tìm trên GreenLens…
                        </div>
                      ) : lookupQuery.isError ? (
                        <div className="px-3 py-3 text-xs text-muted-foreground">
                          Không tìm thấy email
                        </div>
                      ) : lookupQuery.data ? (
                        <LookupResultRow user={lookupQuery.data} onInvite={handlePickLookup} />
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <FieldError>{errors.email?.message}</FieldError>
              </Field>

              <Field>
                <Label htmlFor="recruit-target-role">Vai trò</Label>
                <Controller
                  name="targetRole"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="recruit-target-role">
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                      <SelectContent
                        sideOffset={SELECT_MENU_OFFSET}
                        collisionPadding={SELECT_COLLISION_PADDING}
                      >
                        {TARGET_ROLE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.targetRole?.message}</FieldError>
              </Field>

              <Field>
                <Label htmlFor="recruit-team-id">Đội xử lý</Label>
                <FieldDescription>
                  Có thể tuyển vào văn phòng mà chưa gán đội (Tùy chọn)
                </FieldDescription>
                <Controller
                  name="teamId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.trim() ? field.value : NO_TEAM_VALUE}
                      onValueChange={value => {
                        const nextTeamId = value === NO_TEAM_VALUE ? '' : value;
                        field.onChange(nextTeamId);
                        // Reset; useTeamDetail sẽ quyết định có disable Trưởng nhóm sau.
                        setValue('isLeader', false);
                      }}
                      disabled={teamsLoading}
                    >
                      <SelectTrigger
                        id="recruit-team-id"
                        className="h-10 w-full gap-2 px-2.5 [&>div]:min-w-0 [&>div]:flex-1"
                      >
                        {selectedTeam ? (
                          <TeamSelectRow team={selectedTeam} compact />
                        ) : (
                          <SelectValue
                            placeholder={teamsLoading ? 'Đang tải...' : 'Không chọn đội'}
                          />
                        )}
                      </SelectTrigger>
                      {/* side=top + height cố định; ẩn scroll-chevron Radix (ẩn/hiện gây giật size). */}
                      <SelectContent
                        side="top"
                        sideOffset={SELECT_MENU_OFFSET}
                        collisionPadding={SELECT_COLLISION_PADDING}
                        className={cn(
                          'h-72 max-h-72 w-[var(--radix-select-trigger-width)] overflow-hidden p-0',
                          '[&>button]:hidden',
                          '[&_[data-radix-select-viewport]]:h-full [&_[data-radix-select-viewport]]:max-h-full',
                          '[&_[data-radix-select-viewport]]:overflow-y-auto [&_[data-radix-select-viewport]]:overscroll-contain',
                          '[&_[data-radix-select-viewport]]:p-1'
                        )}
                      >
                        <SelectItem
                          value={NO_TEAM_VALUE}
                          textValue="Không chọn đội"
                          className={cn(
                            'mb-1 cursor-pointer rounded-md py-2 pl-2.5 pr-8',
                            '[&>span.absolute]:left-auto [&>span.absolute]:right-2'
                          )}
                        >
                          Không chọn đội
                        </SelectItem>
                        {teams.map(team => (
                          <SelectItem
                            key={team.id}
                            value={team.id}
                            textValue={team.name}
                            className={cn(
                              'mb-1 cursor-pointer rounded-md py-2 pl-2.5 pr-8 last:mb-0',
                              '[&>span.absolute]:left-auto [&>span.absolute]:right-2'
                            )}
                          >
                            <TeamSelectRow team={team} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.teamId?.message}</FieldError>
              </Field>

              <Controller
                name="isLeader"
                control={control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <Label htmlFor="recruit-is-leader" className="font-normal">
                        Trưởng nhóm
                      </Label>
                      {teamHasLeader ? (
                        <FieldDescription>Đội đã có trưởng nhóm</FieldDescription>
                      ) : null}
                    </div>
                    <Switch
                      id="recruit-is-leader"
                      checked={teamHasLeader ? false : Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      disabled={!hasTeam || teamDetailLoading || teamHasLeader}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-slate-50 px-6 py-4 sm:space-x-0">
            <Button type="button" variant="outline" disabled={isBusy} onClick={onClose}>
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={isBusy || teamsLoading}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                'Thêm'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
