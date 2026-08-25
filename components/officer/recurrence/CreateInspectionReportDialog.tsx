'use client';

import { SuccessDialog } from '@/components/common/SuccessDialog';
import { getInitials } from '@/components/officer/workforce/teamTab/teamTab.shared';
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
import { Field, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateInspectionReport } from '@/hooks/useOfficer';
import { useTeamsList } from '@/hooks/useTeams';
import type { TeamListItem } from '@/lib/api/models/team';
import { toastApiError } from '@/lib/api/toast';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const INSPECTION_TEAM_PARAMS = {
  page: 1,
  pageSize: 50,
  teamType: 'Inspection',
  isActive: true,
} as const;

const FORM_HINT =
  'Chỉ cần chọn đội thanh tra để lập hồ sơ. Thông tin đối tượng vi phạm có thể để trống và bổ sung sau khi khảo sát hiện trường.';

const SUCCESS_DESCRIPTION = (
  <div className="mx-auto max-w-82 space-y-2 text-brand">
    <p className="font-medium">Hồ sơ được tạo ở trạng thái nháp.</p>
    <p>Đội thanh tra được gán sẽ nhận việc trên ứng dụng Mobile.</p>
    <p>Họ khảo sát hiện trường và cập nhật kết quả.</p>
  </div>
);

const inspectionFormSchema = z.object({
  assignedTeamId: z.string().trim().min(1, 'Vui lòng chọn đội thanh tra'),
  violatorName: z.string().trim().max(200, 'Tối đa 200 ký tự'),
  violatorAddress: z.string().trim().max(500, 'Tối đa 500 ký tự'),
  violatorIdentity: z.string().trim().max(100, 'Tối đa 100 ký tự'),
  violationDescription: z.string().trim().max(2000, 'Tối đa 2000 ký tự'),
});

type InspectionFormValues = z.infer<typeof inspectionFormSchema>;

const FORM_DEFAULTS: InspectionFormValues = {
  assignedTeamId: '',
  violatorName: '',
  violatorAddress: '',
  violatorIdentity: '',
  violationDescription: '',
};

/** BE `currentStatus` → nhãn VI ngắn. */
function teamStatusLabelVi(currentStatus: string): string {
  const key = currentStatus.trim().toLowerCase();
  if (key === 'available') return 'Sẵn sàng';
  if (key === 'busy') return 'Đang xử lý';
  return currentStatus.trim() || '—';
}

function TeamSelectRow({
  team,
  className,
  compact = false,
}: {
  team: TeamListItem;
  className?: string;
  /** Trigger đã chọn: chỉ avatar + tên, một hàng. */
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
        <span className="truncate text-sm font-semibold text-foreground">{team.name}</span>
      ) : (
        <span className="min-w-0 flex-1 text-left leading-tight">
          <span className="block truncate text-sm font-semibold text-foreground">{team.name}</span>
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

interface CreateInspectionReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  /** Override navigate “Xem chi tiết”. Mặc định: `/officer/inspections/[id]`. */
  onViewDetail?: (payload: { reportId: string; inspectionId: string }) => void;
}

export function CreateInspectionReportDialog({
  open,
  onOpenChange,
  reportId,
  onViewDetail,
}: CreateInspectionReportDialogProps) {
  const router = useRouter();
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdInspectionId, setCreatedInspectionId] = useState('');

  const createMutation = useCreateInspectionReport();
  const { data: teamsData, isPending: teamsLoading } = useTeamsList(INSPECTION_TEAM_PARAMS, {
    enabled: open && !successOpen,
  });
  const teams = teamsData?.items ?? [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: FORM_DEFAULTS,
  });

  const assignedTeamId = watch('assignedTeamId');
  const selectedTeam = useMemo(
    () => teams.find(t => t.id === assignedTeamId) ?? null,
    [teams, assignedTeamId]
  );

  useEffect(() => {
    if (!open) {
      reset(FORM_DEFAULTS);
      setSuccessOpen(false);
      setCreatedInspectionId('');
    }
  }, [open, reset]);

  const finishFlow = () => {
    setSuccessOpen(false);
    onOpenChange(false);
  };

  const handleCloseForm = () => {
    if (createMutation.isPending) return;
    onOpenChange(false);
  };

  const onSubmit = handleSubmit(values => {
    createMutation.mutate(
      {
        reportId,
        body: {
          assignedTeamId: values.assignedTeamId,
          violatorName: values.violatorName,
          violatorAddress: values.violatorAddress,
          violatorIdentity: values.violatorIdentity,
          violationDescription: values.violationDescription,
        },
      },
      {
        onSuccess: result => {
          setCreatedInspectionId(result.inspectionId);
          setSuccessOpen(true);
        },
        onError: err => {
          toastApiError(err, 'Không thể tạo hồ sơ thanh tra. Vui lòng thử lại.');
        },
      }
    );
  });

  const isBusy = createMutation.isPending;

  return (
    <>
      <Dialog
        open={open && !successOpen}
        onOpenChange={next => {
          if (!next) handleCloseForm();
          else onOpenChange(true);
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <form onSubmit={onSubmit} className="flex flex-col">
            <DialogHeader className="space-y-2 px-5 pt-4 pb-0 text-left">
              <DialogTitle className="flex items-center gap-2 pr-8 text-base font-semibold">
                <FileText className="size-4 shrink-0 text-sky-700" aria-hidden />
                Tạo hồ sơ thanh tra
              </DialogTitle>
              <DialogDescription asChild>
                <div className="rounded-lg border border-sky-200/80 bg-sky-50/80 px-3 py-2.5 text-xs leading-relaxed text-sky-950">
                  <p className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {FORM_HINT}
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[min(60vh,28rem)] space-y-4 overflow-y-auto px-5 pt-4 pb-4">
              <FieldGroup>
                <Field>
                  <Label htmlFor="inspection-team">
                    Đội thanh tra <span className="text-destructive">*</span>
                  </Label>
                  {teamsLoading ? (
                    <div className="mt-2 flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Đang tải danh sách đội...
                    </div>
                  ) : teams.length === 0 ? (
                    <p className="mt-2 rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                      Không có đội thanh tra khả dụng. Hãy kiểm tra danh sách đội trước khi tạo hồ
                      sơ.
                    </p>
                  ) : (
                    <Controller
                      name="assignedTeamId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <SelectTrigger
                            id="inspection-team"
                            className="mt-2 h-10 w-full gap-2 px-2.5 [&>div]:min-w-0 [&>div]:flex-1"
                          >
                            {selectedTeam ? (
                              <TeamSelectRow team={selectedTeam} compact />
                            ) : (
                              <SelectValue placeholder="Chọn đội thanh tra" />
                            )}
                          </SelectTrigger>
                          <SelectContent className="max-h-72 p-1">
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
                  )}
                  <FieldError>{errors.assignedTeamId?.message}</FieldError>
                </Field>

                <Field>
                  <Label htmlFor="violator-name">Tên đối tượng vi phạm</Label>
                  <Input
                    id="violator-name"
                    className="mt-2"
                    placeholder="Có thể để trống"
                    autoComplete="off"
                    maxLength={200}
                    {...register('violatorName')}
                  />
                  <FieldError>{errors.violatorName?.message}</FieldError>
                </Field>

                <Field>
                  <Label htmlFor="violator-address">Địa chỉ đối tượng</Label>
                  <Input
                    id="violator-address"
                    className="mt-2"
                    placeholder="Có thể để trống"
                    autoComplete="off"
                    maxLength={500}
                    {...register('violatorAddress')}
                  />
                  <FieldError>{errors.violatorAddress?.message}</FieldError>
                </Field>

                <Field>
                  <Label htmlFor="violator-identity">Giấy tờ định danh</Label>
                  <Input
                    id="violator-identity"
                    className="mt-2"
                    placeholder="CMND/CCCD hoặc thông tin định danh khác"
                    autoComplete="off"
                    maxLength={100}
                    {...register('violatorIdentity')}
                  />
                  <FieldError>{errors.violatorIdentity?.message}</FieldError>
                </Field>

                <Field>
                  <Label htmlFor="violation-description">Mô tả hành vi vi phạm</Label>
                  <textarea
                    id="violation-description"
                    placeholder="Có thể để trống — đội thanh tra sẽ bổ sung sau khảo sát"
                    rows={3}
                    maxLength={2000}
                    className="mt-2 flex min-h-[80px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register('violationDescription')}
                  />
                  <FieldError>{errors.violationDescription?.message}</FieldError>
                </Field>
              </FieldGroup>
            </div>

            <DialogFooter className="border-t border-border bg-muted/30 px-5 py-3 sm:justify-end">
              <Button type="button" variant="outline" onClick={handleCloseForm} disabled={isBusy}>
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={isBusy || teamsLoading || teams.length === 0}
                className="bg-sky-700 text-white hover:bg-sky-600"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo hồ sơ'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SuccessDialog
        open={successOpen}
        onOpenChange={next => {
          if (!next) finishFlow();
        }}
        title="Thành công"
        description={SUCCESS_DESCRIPTION}
        secondaryAction={{
          label: 'Danh sách hồ sơ',
          onClick: () => {
            const id = createdInspectionId.trim();
            finishFlow();
            const params = new URLSearchParams({ tab: 'inspections' });
            if (id) params.set('highlight', id);
            router.push(`/officer/recurrence?${params.toString()}`);
          },
        }}
        primaryAction={{
          label: 'Xem chi tiết',
          onClick: () => {
            const inspectionId = createdInspectionId.trim();
            if (onViewDetail) {
              onViewDetail({ reportId, inspectionId });
              finishFlow();
              return;
            }
            finishFlow();
            if (inspectionId) {
              router.push(`/officer/inspections/${encodeURIComponent(inspectionId)}`);
            }
          },
        }}
      />
    </>
  );
}
