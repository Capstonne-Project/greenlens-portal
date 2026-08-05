'use client';

import { getInitials, TYPE_LABEL } from '@/components/officer/workforce/teamTab/teamTab.shared';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useRecruitOfficeStaff } from '@/hooks/useLeoOffices';
import { useTeamsList } from '@/hooks/useTeams';
import type { RecruitOfficeStaffInput, RecruitStaffTargetRole } from '@/lib/api/models/office';
import type { TeamListItem, TeamType } from '@/lib/api/models/team';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import { cn } from '@/lib/utils';
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo } from 'react';
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

  const selectedTeamId = watch('teamId');
  const hasTeam = Boolean(selectedTeamId?.trim());
  const selectedTeam = useMemo(
    () => teams.find(t => t.id === selectedTeamId) ?? null,
    [teams, selectedTeamId]
  );
  const isBusy = recruitMutation.isPending;

  useEffect(() => {
    if (!open) {
      reset({
        email: '',
        targetRole: 'Cleaner',
        teamId: '',
        isLeader: false,
      });
    }
  }, [open, reset]);

  const onSubmit = handleSubmit(async values => {
    const teamId = values.teamId?.trim() || null;
    const payload: RecruitOfficeStaffInput = {
      email: values.email.trim(),
      targetRole: values.targetRole,
      teamId,
      isLeader: teamId ? Boolean(values.isLeader) : false,
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
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        onInteractOutside={e => {
          if (isBusy) e.preventDefault();
        }}
        onEscapeKeyDown={e => {
          if (isBusy) e.preventDefault();
        }}
      >
        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="space-y-4 p-6 pb-8 md:p-8 md:pb-10">
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
                  <Label htmlFor="recruit-email">Email công dân</Label>
                  {!errors.email ? (
                    <FieldDescription>
                      Chỉ tài khoản Citizen chưa thuộc văn phòng khác mới được tuyển
                    </FieldDescription>
                  ) : null}
                </div>
                <Input
                  id="recruit-email"
                  type="email"
                  placeholder="vd: nguyenvana@example.com"
                  autoFocus
                  {...register('email')}
                />
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
                        if (!nextTeamId) setValue('isLeader', false);
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
                    <Label htmlFor="recruit-is-leader" className="font-normal">
                      Trưởng nhóm
                    </Label>
                    <Switch
                      id="recruit-is-leader"
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      disabled={!hasTeam}
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
