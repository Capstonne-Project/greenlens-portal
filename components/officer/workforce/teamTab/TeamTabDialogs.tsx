'use client';

import { ValidatedInput } from '@/components/common/ValidatedField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useOfficeStaffList } from '@/hooks/useLeoOffices';
import { useAddTeamMember, useCreateTeam, useTeamDetail } from '@/hooks/useTeams';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import type { TeamListItem } from '@/lib/api/models/team';
import { cn } from '@/lib/utils';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Crown, Loader2, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  addMemberSchema,
  buildAddMemberStaffParams,
  createTeamSchema,
  getInitials,
  PAGE_SIZE,
  TEAM_NAME_MAX,
  TEAM_NAME_MIN,
  teamTypeToStaffRole,
  TYPE_DOT,
  TYPE_LABEL,
  type AddMemberFormValues,
  type CreateTeamFormValues,
  type LeoCreateTeamType,
} from './teamTab.shared';

export function CreateTeamDialog({
  open,
  teamType,
  onClose,
}: {
  open: boolean;
  teamType: LeoCreateTeamType;
  onClose: () => void;
}) {
  const createTeamMutation = useCreateTeam();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitted, touchedFields, dirtyFields },
  } = useForm<CreateTeamFormValues>({
    ...REALTIME_FORM_OPTIONS,
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: '' },
  });

  const isBusy = createTeamMutation.isPending;
  const nameValue = useWatch({ control, name: 'name', defaultValue: '' }) ?? '';
  /** Chỉ hiện lỗi Zod sau khi đã tương tác hoặc submit — không đỏ khi vừa mở dialog. */
  const nameError =
    errors.name && (touchedFields.name || dirtyFields.name || isSubmitted)
      ? errors.name.message
      : undefined;

  const closeDialog = () => {
    reset({ name: '' });
    onClose();
  };

  const onSubmit = handleSubmit(async values => {
    try {
      const res = await createTeamMutation.mutateAsync({
        name: values.name,
        teamType,
      });
      toastApiSuccess(res, 'Đã tạo đội mới.');
      closeDialog();
    } catch (err) {
      toastApiError(err, 'Không thể tạo đội. Vui lòng thử lại.');
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen && !isBusy) closeDialog();
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
          <div className="space-y-4 p-6 md:p-8">
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="flex items-center gap-2.5">
                <FontAwesomeIcon
                  icon={faUserGroup}
                  className="size-4 shrink-0 text-foreground"
                  aria-hidden
                />
                Tạo đội mới
              </DialogTitle>
              <DialogDescription>Tạo đội cộng đồng trong văn phòng của bạn.</DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <Label>Loại đội</Label>
                <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm text-foreground">
                  <span
                    className={cn(
                      'inline-block size-2.5 shrink-0 rounded-full',
                      TYPE_DOT[teamType] ?? 'bg-slate-300'
                    )}
                    aria-hidden
                  />
                  <span className="font-medium">{TYPE_LABEL[teamType] ?? teamType}</span>
                </div>
              </Field>
              <Field>
                <Label htmlFor="create-team-name">Tên đội</Label>
                <FieldDescription>Ví dụ: Đội dọn dẹp khu vực A</FieldDescription>
                <ValidatedInput
                  id="create-team-name"
                  placeholder="Nhập tên đội"
                  disabled={isBusy}
                  {...register('name')}
                  value={nameValue}
                  minLength={TEAM_NAME_MIN}
                  maxLength={TEAM_NAME_MAX}
                  error={nameError}
                  className="h-9 rounded-md"
                />
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-slate-50 px-6 py-4 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={closeDialog}
              className="cursor-pointer"
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={isBusy}
              className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {isBusy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Đang tạo...
                </>
              ) : (
                'Tạo đội'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddMemberDialog({
  open,
  teamId,
  teamName,
  teamType,
  onClose,
}: {
  open: boolean;
  teamId: string;
  teamName: string;
  teamType: string;
  onClose: () => void;
}) {
  const addMemberMutation = useAddTeamMember();
  const [staffSelectOpen, setStaffSelectOpen] = useState(false);

  const staffRole = teamTypeToStaffRole(teamType);
  const staffListParams = useMemo(() => buildAddMemberStaffParams(teamType), [teamType]);

  const {
    data: staffData,
    isPending: staffLoading,
    isError: staffError,
    isFetched: staffFetched,
  } = useOfficeStaffList(staffListParams ?? { page: 1, pageSize: PAGE_SIZE }, {
    enabled: open && Boolean(teamId) && staffListParams != null && staffSelectOpen,
  });
  const staffOptions = staffData?.items ?? [];

  /** GET /v1/teams/{id} — members[].isLeader */
  const { data: teamDetail, isPending: teamDetailLoading } = useTeamDetail(
    open && teamId ? teamId : null
  );
  const hasLeader = useMemo(
    () => (teamDetail?.members ?? []).some(m => m.isLeader),
    [teamDetail?.members]
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { userId: '', isLeader: false },
  });

  useEffect(() => {
    if (hasLeader) {
      setValue('isLeader', false);
    }
  }, [hasLeader, setValue]);

  const closeDialog = () => {
    setStaffSelectOpen(false);
    reset({ userId: '', isLeader: false });
    onClose();
  };

  const onSubmit = handleSubmit(async values => {
    try {
      const res = await addMemberMutation.mutateAsync({
        teamId,
        body: { userId: values.userId, isLeader: hasLeader ? false : values.isLeader },
      });
      toastApiSuccess(res, 'Đã thêm thành viên vào đội.');
      closeDialog();
    } catch (err) {
      toastApiError(err, 'Không thể thêm thành viên. Vui lòng thử lại.');
    }
  });

  const formBusy = addMemberMutation.isPending || staffLoading;
  const staffSelectDisabled = !staffRole || staffError;
  const staffListEmpty =
    staffSelectOpen && staffFetched && !staffLoading && staffOptions.length === 0;
  const leaderSwitchDisabled = formBusy || teamDetailLoading || hasLeader;

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) closeDialog();
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="space-y-4 p-6 md:p-8">
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="flex items-center gap-2.5">
                <FontAwesomeIcon
                  icon={faUserGroup}
                  className="size-4 shrink-0 text-foreground"
                  aria-hidden
                />
                Thêm thành viên
              </DialogTitle>
              <DialogDescription>
                Gán nhân sự chưa thuộc đội vào{' '}
                <span className="font-medium text-foreground">{teamName}</span>
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <Label htmlFor="add-member-user">Thành viên</Label>
                <FieldDescription>
                  {staffRole
                    ? `Nhân sự chưa có đội — vai trò ${staffRole === 'Cleaner' ? 'Dọn dẹp' : 'Thanh tra'}`
                    : 'Loại đội không hỗ trợ thêm thành viên qua danh sách nhân sự.'}
                </FieldDescription>
                <Controller
                  name="userId"
                  control={control}
                  render={({ field }) => {
                    const selectedMember = staffOptions.find(m => m.userId === field.value) ?? null;

                    return (
                      <Select
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        open={staffSelectOpen}
                        onOpenChange={setStaffSelectOpen}
                        disabled={staffSelectDisabled}
                      >
                        <SelectTrigger
                          id="add-member-user"
                          className={cn(
                            'h-auto min-h-10 items-center gap-2 py-1.5',
                            // SelectTrigger mặc định [&>span]:line-clamp-1 làm vỡ block avatar+tên+email
                            selectedMember &&
                              '[&>span]:line-clamp-none [&>span]:flex [&>span]:min-w-0 [&>span]:flex-1 [&>span]:items-center'
                          )}
                        >
                          {selectedMember ? (
                            <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                              <span
                                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700"
                                aria-hidden
                              >
                                {getInitials(selectedMember.fullName)}
                              </span>
                              <span className="min-w-0 flex-1 overflow-hidden">
                                <span className="block truncate text-sm font-medium leading-tight text-foreground">
                                  {selectedMember.fullName}
                                </span>
                                <span className="mt-0.5 block truncate text-xs leading-tight text-muted-foreground">
                                  {selectedMember.email}
                                </span>
                              </span>
                            </span>
                          ) : (
                            <SelectValue
                              placeholder={
                                !staffRole
                                  ? 'Loại đội không hợp lệ'
                                  : staffError
                                    ? 'Không tải được danh sách'
                                    : staffLoading
                                      ? 'Đang tải danh sách...'
                                      : staffListEmpty
                                        ? 'Không có nhân sự khả dụng'
                                        : 'Chọn thành viên'
                              }
                            />
                          )}
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={8}>
                          {staffLoading ? (
                            <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                              <Loader2 className="size-4 animate-spin" aria-hidden />
                              Đang tải danh sách...
                            </div>
                          ) : staffListEmpty ? (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                              Không có nhân sự khả dụng
                            </div>
                          ) : (
                            staffOptions.map(member => (
                              <SelectItem
                                key={member.userId}
                                value={member.userId}
                                textValue={`${member.fullName} ${member.email}`}
                                className={cn(
                                  // w-full + mx khiến hover dính mép phải — trừ đúng tổng margin 2 bên
                                  'mx-1.5 my-0.5 h-auto w-[calc(100%-0.75rem)] cursor-pointer rounded-md py-2.5 pl-2.5 pr-2.5',
                                  '[&>span.absolute]:hidden'
                                )}
                              >
                                <span className="flex min-w-0 items-center gap-3">
                                  <span
                                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700"
                                    aria-hidden
                                  >
                                    {getInitials(member.fullName)}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium leading-snug text-foreground">
                                      {member.fullName}
                                    </span>
                                    <span className="mt-0.5 block truncate text-xs leading-snug text-muted-foreground">
                                      {member.email}
                                    </span>
                                  </span>
                                </span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    );
                  }}
                />
                <FieldError>{errors.userId?.message}</FieldError>
              </Field>

              <Controller
                name="isLeader"
                control={control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <Label htmlFor="add-member-leader" className="font-normal">
                        Trưởng nhóm
                      </Label>
                      {hasLeader ? (
                        <FieldDescription>Đội đã có trưởng nhóm</FieldDescription>
                      ) : null}
                    </div>
                    <Switch
                      id="add-member-leader"
                      checked={hasLeader ? false : field.value}
                      onCheckedChange={field.onChange}
                      disabled={leaderSwitchDisabled}
                    />
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-slate-50 px-6 py-4 sm:space-x-0">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={addMemberMutation.isPending}
                className="cursor-pointer"
              >
                Huỷ
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={formBusy || !staffRole || staffError || staffListEmpty}
              className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {addMemberMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Đang thêm...
                </>
              ) : (
                'Thêm vào đội'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RemoveMemberConfirmDialog({
  open,
  memberName,
  submitting,
  onConfirm,
  onClose,
}: {
  open: boolean;
  memberName: string;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen && !submitting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <Trash2 className="size-4 text-destructive" aria-hidden />
            </span>
            Xóa thành viên
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa <span className="font-medium text-foreground">{memberName}</span>{' '}
            khỏi đội này? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              className="cursor-pointer"
            >
              Huỷ
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={submitting}
            onClick={onConfirm}
            className="cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Đang xóa...
              </>
            ) : (
              'Xác nhận'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TeamDetailDialog({
  team,
  onClose,
  onAddMember,
}: {
  team: TeamListItem;
  onClose: () => void;
  onAddMember: () => void;
}) {
  const { data: detail, isLoading: membersLoading } = useTeamDetail(team.id);
  const members = [...(detail?.members ?? [])].sort(
    (a, b) => Number(b.isLeader) - Number(a.isLeader)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg border border-border bg-card shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-foreground">{team.name}</h2>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="size-3 shrink-0" />
              <span className="truncate">{team.officeName}</span>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              team.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {team.isActive ? '● Hoạt động' : '● Tạm dừng'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-1 shrink-0 cursor-pointer rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Member list */}
        <div className="max-h-80 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Thành viên ({membersLoading ? '…' : members.length})
          </p>

          {membersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex animate-pulse items-center gap-2.5">
                  <div className="size-8 rounded-full bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-28 rounded bg-muted" />
                    <div className="h-2 w-36 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">Chưa có thành viên</p>
          ) : (
            <ul className="space-y-2.5">
              {members.map(m => (
                <li key={m.userId} className="flex items-center gap-2.5">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      m.isLeader ? 'bg-amber-400' : 'bg-slate-300'
                    }`}
                  >
                    {getInitials(m.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">{m.fullName}</p>
                    <p className="truncate text-[11px] text-slate-500">{m.email}</p>
                  </div>
                  {m.isLeader && <Crown className="size-3.5 shrink-0 text-amber-400" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onAddMember}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground transition hover:border-emerald-300 hover:text-emerald-600"
          >
            <UserPlus className="size-3.5" />
            Thêm thành viên vào đội
          </button>
        </div>
      </div>
    </div>
  );
}
