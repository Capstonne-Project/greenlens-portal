'use client';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAssignInspectionTeam } from '@/hooks/useOfficer';
import { useTeamsList } from '@/hooks/useTeams';
import type { TeamListItem } from '@/lib/api/models/team';
import { toastApiError } from '@/lib/api/toast';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Users } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const INSPECTION_TEAM_PARAMS = {
  page: 1,
  pageSize: 50,
  teamType: 'Inspection',
  isActive: true,
  isAvailable: true,
} as const;

/** Tránh `?? []` tạo mảng mới mỗi render → useEffect/reset loop. */
const EMPTY_TEAMS: TeamListItem[] = [];

const schema = z.object({
  assignedTeamId: z.string().trim().min(1, 'Vui lòng chọn đội thanh tra'),
});

type FormValues = z.infer<typeof schema>;

function teamStatusLabelVi(currentStatus: string): string {
  const key = currentStatus.trim().toLowerCase();
  if (key === 'available') return 'Sẵn sàng';
  if (key === 'busy') return 'Đang xử lý';
  return currentStatus.trim() || '—';
}

function TeamSelectRow({ team, compact = false }: { team: TeamListItem; compact?: boolean }) {
  const statusLabel = teamStatusLabelVi(team.currentStatus);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
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

export function AssignInspectionTeamDialog({
  open,
  onOpenChange,
  inspectionId,
  mode,
  currentTeamId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionId: string;
  /** Gán lần đầu vs đổi đội đã gán. */
  mode: 'assign' | 'change';
  currentTeamId: string | null;
}) {
  const assignMutation = useAssignInspectionTeam();
  const { data: teamsData, isPending: teamsLoading } = useTeamsList(INSPECTION_TEAM_PARAMS, {
    enabled: open,
  });
  const teams = teamsData?.items ?? EMPTY_TEAMS;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { assignedTeamId: '' },
  });

  const selectedId = watch('assignedTeamId');
  const selectedTeam = useMemo(
    () => teams.find(t => t.id === selectedId) ?? null,
    [teams, selectedId]
  );

  useEffect(() => {
    if (!open) {
      reset({ assignedTeamId: '' });
      return;
    }
    const items = teamsData?.items;
    const canPrefill =
      mode === 'change' &&
      Boolean(currentTeamId) &&
      Boolean(items?.some(t => t.id === currentTeamId));
    reset({
      assignedTeamId: canPrefill && currentTeamId ? currentTeamId : '',
    });
  }, [open, mode, currentTeamId, teamsData?.items, reset]);

  const isBusy = assignMutation.isPending;
  const title = mode === 'assign' ? 'Gán đội thanh tra' : 'Đổi đội thanh tra';
  const submitLabel = mode === 'assign' ? 'Gán đội' : 'Đổi đội';

  const onSubmit = handleSubmit(values => {
    if (mode === 'change' && values.assignedTeamId === currentTeamId) {
      toast.message('Đội không thay đổi');
      return;
    }

    assignMutation.mutate(
      {
        inspectionId,
        body: { assignedTeamId: values.assignedTeamId },
      },
      {
        onSuccess: () => {
          toast.success(mode === 'assign' ? 'Đã gán đội thanh tra' : 'Đã đổi đội thanh tra');
          onOpenChange(false);
        },
        onError: err => {
          toastApiError(
            err,
            mode === 'assign'
              ? 'Không thể gán đội. Vui lòng thử lại.'
              : 'Không thể đổi đội. Vui lòng thử lại.'
          );
        },
      }
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (isBusy) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <form onSubmit={onSubmit} className="flex flex-col">
          <DialogHeader className="space-y-1.5 px-5 pt-4 pb-0 text-left">
            <DialogTitle className="flex items-center gap-2 pr-8 text-base font-semibold">
              <Users className="size-4 shrink-0 text-sky-700" aria-hidden />
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-slate-500">
              Chỉ đội thanh tra khả dụng mới hiện trong danh sách. Đội nhận việc trên Mobile để khảo
              sát hiện trường.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 pt-4 pb-4">
            <FieldGroup>
              <Field>
                <Label htmlFor="assign-inspection-team">
                  Đội thanh tra <span className="text-destructive">*</span>
                </Label>
                {teamsLoading ? (
                  <div className="mt-2 flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Đang tải danh sách đội...
                  </div>
                ) : teams.length === 0 ? (
                  <p className="mt-2 rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                    Không có đội thanh tra khả dụng.
                  </p>
                ) : (
                  <Controller
                    name="assignedTeamId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="assign-inspection-team"
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
            </FieldGroup>
          </div>

          <DialogFooter className="border-t border-border bg-muted/30 px-5 py-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => onOpenChange(false)}
            >
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
                  Đang lưu...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
