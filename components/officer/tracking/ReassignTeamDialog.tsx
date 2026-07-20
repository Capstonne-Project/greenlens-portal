'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTeamsList } from '@/hooks/useTeams';
import { useReassignReport } from '@/hooks/useOfficer';
import type { TeamListItem } from '@/lib/api/services/fetchTeam';
import { isReassignReasonValid, REASSIGN_REASON_MIN_LENGTH } from '@/utils/reportAssignments';
import type { ReportAssignment } from '@/lib/api/models/report';
import { AlertCircle, ArrowRightLeft, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';

const TEAM_TYPE_LABEL: Record<string, string> = {
  Cleanup: 'Dọn dẹp',
  Inspection: 'Kiểm tra',
  Response: 'Ứng phó',
  Monitoring: 'Giám sát',
};

export interface ReassignTarget {
  teamId: string;
  teamName: string;
}

interface ReassignTeamDialogProps {
  open: boolean;
  onClose: () => void;
  reportId: string;
  reportCode: string;
  oldTeam: ReassignTarget;
  assignments: ReportAssignment[];
  /** Lọc đội cùng loại — lấy từ đội cũ khi có. */
  teamType?: string;
  onSuccess?: () => void;
}

export function ReassignTeamDialog({
  open,
  onClose,
  reportId,
  reportCode,
  oldTeam,
  teamType,
  onSuccess,
}: ReassignTeamDialogProps) {
  const [newTeamId, setNewTeamId] = useState('');
  const [reason, setReason] = useState('');

  const reassignMutation = useReassignReport();

  const { data, isLoading } = useTeamsList({
    page: 1,
    pageSize: 50,
    isActive: true,
    isAvailable: true,
    ...(teamType ? { teamType } : {}),
  });

  const teams: TeamListItem[] = useMemo(() => {
    return (data?.items ?? []).filter(t => t.id !== oldTeam.teamId);
  }, [data?.items, oldTeam.teamId]);

  // Reset form khi dialog chuyển từ open → close.
  // Dùng cleanup để setState chạy trước khi unmount/effect re-run, tránh
  // rule `react-hooks/set-state-in-effect` (gọi setState ngay trong effect body).
  useEffect(() => {
    if (!open) return;
    return () => {
      setNewTeamId('');
      setReason('');
    };
  }, [open]);

  if (!open) return null;

  const reasonLen = reason.trim().length;
  const canSubmit =
    Boolean(newTeamId) && isReassignReasonValid(reason) && !reassignMutation.isPending;

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
          toastApiSuccess(null, `Đã chuyển giao báo cáo ${reportCode} sang đội mới.`);
          onClose();
          onSuccess?.();
        },
        onError: err => {
          toastApiError(err, 'Không thể chuyển giao. Vui lòng kiểm tra trạng thái đội và thử lại.');
        },
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={e => {
        if (e.target === e.currentTarget && !reassignMutation.isPending) onClose();
      }}
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Chuyển giao đội</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Báo cáo <span className="font-semibold text-foreground">{reportCode}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={reassignMutation.isPending}
            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-900">
            <p className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              Lý do chuyển giao được lưu vào nhật ký xử lý. Chọn đội cùng loại với đội hiện tại.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">Từ</span>
            <span className="flex-1 truncate text-sm font-semibold text-foreground">
              {oldTeam.teamName}
            </span>
            <ArrowRightLeft className="size-4 shrink-0 text-amber-600" />
            <span className="text-xs text-muted-foreground">Đội mới</span>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Chọn đội nhận chuyển giao
            </p>
            <div className="mt-2 max-h-56 min-h-0 overflow-y-auto rounded-lg border border-border">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Đang tải danh sách đội...
                </div>
              )}
              {!isLoading && teams.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Không có đội phù hợp để chuyển giao.
                </p>
              )}
              {!isLoading &&
                teams.map(team => {
                  const selected = newTeamId === team.id;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setNewTeamId(team.id)}
                      className={`flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition last:border-b-0 ${
                        selected ? 'bg-amber-50/80' : 'hover:bg-muted/40'
                      }`}
                    >
                      <span
                        className={`size-4 shrink-0 rounded-full border-2 ${
                          selected ? 'border-amber-600 bg-amber-600' : 'border-muted-foreground/40'
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {team.name}
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {team.officeName}
                        </span>
                      </span>
                      <Badge
                        variant="outline"
                        className="shrink-0 rounded-full border-amber-200 bg-amber-50 px-2 py-0 text-[10px] font-medium text-amber-800"
                      >
                        {TEAM_TYPE_LABEL[team.teamType] ?? team.teamType}
                      </Badge>
                    </button>
                  );
                })}
            </div>
          </div>

          <div>
            <label
              htmlFor="reassign-reason"
              className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              Lý do chuyển giao <span className="text-destructive">*</span>
            </label>
            <textarea
              id="reassign-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              placeholder="Mô tả lý do chuyển giao (tối thiểu 20 ký tự)..."
              className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            <p
              className={`mt-1 text-right text-[11px] ${
                reasonLen >= REASSIGN_REASON_MIN_LENGTH
                  ? 'text-emerald-600'
                  : 'text-muted-foreground'
              }`}
            >
              {reasonLen}/{REASSIGN_REASON_MIN_LENGTH} ký tự
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3">
          <Button variant="outline" onClick={onClose} disabled={reassignMutation.isPending}>
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-amber-600 text-white hover:bg-amber-500"
          >
            <ArrowRightLeft className="mr-1.5 size-4" />
            {reassignMutation.isPending ? 'Đang chuyển giao...' : 'Xác nhận chuyển giao'}
          </Button>
        </div>
      </div>
    </div>
  );
}
