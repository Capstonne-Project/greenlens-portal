'use client';

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
import { useAddCompanyTeamMember, useCompanyStaffList } from '@/hooks/useCompany';
import { cn } from '@/lib/utils';
import { getCompanyMutationError } from '@/utils/companyUi';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const STAFF_PAGE_SIZE = 100;

const addMemberSchema = z.object({
  userId: z.string().min(1, 'Vui lòng chọn thành viên'),
  isLeader: z.boolean(),
});

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export type CompanyTeamAddMemberTarget = {
  id: string;
  name: string;
};

interface CompanyTeamAddMemberDialogProps {
  open: boolean;
  team: CompanyTeamAddMemberTarget | null;
  onClose: () => void;
}

export function CompanyTeamAddMemberDialog({
  open,
  team,
  onClose,
}: CompanyTeamAddMemberDialogProps) {
  const addMember = useAddCompanyTeamMember();
  const [staffSelectOpen, setStaffSelectOpen] = useState(false);

  const {
    data: staffData,
    isPending: staffLoading,
    isError: staffError,
    isFetched: staffFetched,
  } = useCompanyStaffList(
    { page: 1, pageSize: STAFF_PAGE_SIZE, isActive: true },
    { enabled: open && Boolean(team) && staffSelectOpen }
  );

  const staffOptions = useMemo(() => {
    const items = staffData?.items ?? [];
    return items.filter(s => s.isActive && !s.teamId);
  }, [staffData?.items]);

  const hasLeader = useMemo(() => {
    if (!team) return false;
    return (staffData?.items ?? []).some(s => s.teamId === team.id && s.position === 'Team Leader');
  }, [staffData?.items, team]);

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
    if (!team) return;
    try {
      const res = await addMember.mutateAsync({
        teamId: team.id,
        body: {
          userId: values.userId,
          isLeader: hasLeader ? false : values.isLeader,
        },
      });
      toast.success(res.message?.trim() || 'Đã thêm thành viên vào đội.');
      closeDialog();
    } catch (err) {
      toast.error(getCompanyMutationError(err, 'Không thể thêm thành viên. Vui lòng thử lại.'));
    }
  });

  const formBusy = addMember.isPending || staffLoading;
  const staffListEmpty =
    staffSelectOpen && staffFetched && !staffLoading && staffOptions.length === 0;
  const leaderSwitchDisabled = formBusy || hasLeader;

  return (
    <Dialog
      open={open && Boolean(team)}
      onOpenChange={nextOpen => {
        if (!nextOpen && !addMember.isPending) closeDialog();
      }}
    >
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        onInteractOutside={e => {
          if (addMember.isPending) e.preventDefault();
        }}
        onEscapeKeyDown={e => {
          if (addMember.isPending) e.preventDefault();
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
                Thêm thành viên
              </DialogTitle>
              <DialogDescription>
                Gán thành viên chưa thuộc đội vào{' '}
                <span className="font-medium text-foreground">{team?.name}</span>
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <Label htmlFor="company-add-member-user">Thành viên</Label>
                <FieldDescription>
                  Chỉ hiển thị thành viên đang hoạt động và chưa có đội — mở danh sách để tải
                </FieldDescription>
                <Controller
                  name="userId"
                  control={control}
                  render={({ field }) => {
                    const selectedMember = staffOptions.find(m => m.userId === field.value) ?? null;

                    return (
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                        open={staffSelectOpen}
                        onOpenChange={setStaffSelectOpen}
                        disabled={staffError || addMember.isPending}
                      >
                        <SelectTrigger
                          id="company-add-member-user"
                          className={cn(
                            'h-auto min-h-10 items-center gap-2 py-1.5',
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
                                staffError
                                  ? 'Không tải được danh sách'
                                  : staffLoading
                                    ? 'Đang tải danh sách...'
                                    : staffListEmpty
                                      ? 'Không có thành viên khả dụng'
                                      : 'Chọn thành viên'
                              }
                            />
                          )}
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          sideOffset={8}
                          className="max-h-72 w-[var(--radix-select-trigger-width)]"
                        >
                          {staffLoading ? (
                            <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                              <Loader2 className="size-4 animate-spin" aria-hidden />
                              Đang tải danh sách...
                            </div>
                          ) : staffOptions.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                              Không có thành viên khả dụng
                            </div>
                          ) : (
                            staffOptions.map(member => (
                              <SelectItem
                                key={member.userId}
                                value={member.userId}
                                textValue={`${member.fullName} ${member.email}`}
                                className={cn(
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
                      <Label htmlFor="company-add-member-leader" className="font-normal">
                        Trưởng nhóm
                      </Label>
                      {hasLeader ? (
                        <FieldDescription>Đội đã có trưởng nhóm</FieldDescription>
                      ) : null}
                    </div>
                    <Switch
                      id="company-add-member-leader"
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
                disabled={addMember.isPending}
                className="cursor-pointer"
              >
                Huỷ
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={formBusy || staffError || staffOptions.length === 0}
              className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {addMember.isPending ? (
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
