'use client';

import { Button } from '@/components/ui/button';
import { Modal, ModalBody, ModalContent, ModalFooter } from '@/components/ui/animated-modal';
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
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const TARGET_ROLE_OPTIONS: { value: RecruitStaffTargetRole; label: string }[] = [
  { value: 'Cleaner', label: 'Đội dọn dẹp (Cleaner)' },
  { value: 'Inspector', label: 'Thanh tra (Inspector)' },
];

const NO_TEAM_VALUE = '__none__';

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
    <Modal
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) onClose();
      }}
      dismissible={!isBusy}
    >
      <ModalBody className="min-h-0 max-h-[90vh] w-full max-w-md flex-none overflow-hidden md:max-w-md">
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ModalContent className="gap-4 p-6 md:p-8">
            <div className="pr-8">
              <h2 className="text-lg font-semibold text-slate-900">Thêm thành viên</h2>
              <p className="mt-1 text-sm text-slate-500">
                Tuyển công dân vào văn phòng và đội xử lý
              </p>
            </div>

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
                      <SelectContent>
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
                  Tuỳ chọn — có thể tuyển vào văn phòng mà chưa gán đội
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
                      <SelectTrigger id="recruit-team-id">
                        <SelectValue placeholder={teamsLoading ? 'Đang tải...' : 'Chọn đội'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_TEAM_VALUE}>Không chọn đội</SelectItem>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
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
          </ModalContent>

          <ModalFooter className="gap-2 bg-slate-50">
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
          </ModalFooter>
        </form>
      </ModalBody>
    </Modal>
  );
}
