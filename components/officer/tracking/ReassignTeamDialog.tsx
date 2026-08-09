'use client';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReassignReport } from '@/hooks/useOfficer';
import { useTeamsList } from '@/hooks/useTeams';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import type { TeamListItem } from '@/lib/api/models/team';
import { cn } from '@/lib/utils';
import { isReassignReasonValid, REASSIGN_REASON_MIN_LENGTH } from '@/utils/reportAssignments';
import { TYPE_LABEL } from '@/components/officer/workforce/teamTab/teamTab.shared';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

function getTeamInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

export interface ReassignTarget {
  teamId: string;
  teamName: string;
  teamType?: string;
}

interface ReassignTeamDialogProps {
  open: boolean;
  onClose: () => void;
  reportId: string;
  reportCode: string;
  oldTeam: ReassignTarget;
  onSuccess?: () => void;
}

/**
 * Dialog chuyển giao đội — PUT /v1/reports/{id}/reassign.
 * UI Select giống TeamTabDialogs (AddMember).
 */
export function ReassignTeamDialog({
  open,
  onClose,
  reportId,
  reportCode,
  oldTeam,
  onSuccess,
}: ReassignTeamDialogProps) {
  const [newTeamId, setNewTeamId] = useState('');
  const [reason, setReason] = useState('');
  const [teamSelectOpen, setTeamSelectOpen] = useState(false);

  const reassignMutation = useReassignReport();
  const teamType = oldTeam.teamType?.trim() || undefined;

  const {
    data,
    isPending: teamsLoading,
    isError: teamsError,
  } = useTeamsList(
    {
      page: 1,
      pageSize: 50,
      isActive: true,
      isAvailable: true,
      ...(teamType ? { teamType } : {}),
    },
    { enabled: open }
  );

  const teams: TeamListItem[] = useMemo(
    () => (data?.items ?? []).filter(t => t.id !== oldTeam.teamId),
    [data?.items, oldTeam.teamId]
  );

  const selectedTeam = teams.find(t => t.id === newTeamId) ?? null;
  const reasonLen = reason.trim().length;
  const reasonOk = isReassignReasonValid(reason);
  const isBusy = reassignMutation.isPending;
  const canSubmit = Boolean(newTeamId) && reasonOk && !isBusy && !teamsError;

  const resetAndClose = () => {
    setNewTeamId('');
    setReason('');
    setTeamSelectOpen(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    reassignMutation.mutate(
      {
        reportId,
        body: {
          oldTeamId: oldTeam.teamId,
          newTeamId,
          reason: reason.trim(),
        },
      },
      {
        onSuccess: () => {
          toastApiSuccess(null, `Đã phân công lại báo cáo ${reportCode}.`);
          resetAndClose();
          onSuccess?.();
        },
        onError: err => {
          toastApiError(
            err,
            'Không thể phân công lại. Kiểm tra loại đội / tải công việc và thử lại.'
          );
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen && !isBusy) resetAndClose();
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
        <div className="flex flex-col">
          <div className="space-y-4 p-6 md:p-8">
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="flex items-center gap-2.5">
                <ArrowRightLeft className="size-4 shrink-0 text-foreground" aria-hidden />
                Phân công lại đội
              </DialogTitle>
              <DialogDescription>
                Chuyển giao từ{' '}
                <span className="font-medium text-foreground">{oldTeam.teamName}</span>
                {teamType ? <> · loại {TYPE_LABEL[teamType] ?? teamType}</> : null}. Báo cáo{' '}
                <span className="font-medium text-foreground">{reportCode}</span>.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <Label htmlFor="reassign-new-team">Đội nhận chuyển giao</Label>
                <FieldDescription>
                  Chỉ hiện đội cùng loại, đang rảnh (Available), khác đội đã từ chối.
                </FieldDescription>
                <Select
                  value={newTeamId}
                  onValueChange={setNewTeamId}
                  open={teamSelectOpen}
                  onOpenChange={setTeamSelectOpen}
                  disabled={isBusy || teamsError}
                >
                  <SelectTrigger id="reassign-new-team" className="h-auto min-h-10 py-2">
                    {selectedTeam ? (
                      <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700"
                          aria-hidden
                        >
                          {getTeamInitials(selectedTeam.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium leading-snug text-foreground">
                            {selectedTeam.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs leading-snug text-muted-foreground">
                            {selectedTeam.officeName ?? '—'}
                            {selectedTeam.memberCount != null
                              ? ` · ${selectedTeam.memberCount} thành viên`
                              : ''}
                          </span>
                        </span>
                      </span>
                    ) : (
                      <SelectValue placeholder={teamsLoading ? 'Đang tải đội…' : 'Chọn đội mới'} />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {teamsLoading ? (
                      <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Đang tải…
                      </div>
                    ) : teams.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        Không có đội phù hợp để phân công lại.
                      </div>
                    ) : (
                      teams.map(team => (
                        <SelectItem key={team.id} value={team.id} className="py-2">
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700"
                              aria-hidden
                            >
                              {getTeamInitials(team.name)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">
                                {team.name}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {TYPE_LABEL[team.teamType] ?? team.teamType}
                                {team.officeName ? ` · ${team.officeName}` : ''}
                              </span>
                            </span>
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {teamsError ? (
                  <FieldError>Không tải được danh sách đội. Thử đóng/mở lại dialog.</FieldError>
                ) : null}
              </Field>

              <Field>
                <Label htmlFor="reassign-reason">
                  Lý do phân công lại <span className="text-destructive">*</span>
                </Label>
                <FieldDescription>
                  Tối thiểu {REASSIGN_REASON_MIN_LENGTH} ký tự — lưu vào nhật ký xử lý.
                </FieldDescription>
                <textarea
                  id="reassign-reason"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={4}
                  disabled={isBusy}
                  placeholder="Mô tả lý do phân công lại…"
                  className="min-h-24 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p
                  className={cn(
                    'text-right text-[11px]',
                    reasonOk ? 'text-emerald-600' : 'text-muted-foreground'
                  )}
                >
                  {reasonLen}/{REASSIGN_REASON_MIN_LENGTH} ký tự
                </p>
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4 md:px-8">
            <Button
              type="button"
              variant="outline"
              onClick={resetAndClose}
              disabled={isBusy}
              className="cursor-pointer"
            >
              Huỷ
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {isBusy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Đang phân công…
                </>
              ) : (
                <>
                  <ArrowRightLeft className="size-4" aria-hidden />
                  Xác nhận phân công lại
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
