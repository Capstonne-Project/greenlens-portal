'use client';

/**
 * Company Manager — phân công đội dọn dẹp.
 * Chrome UI parity LeoAssignDialog (header / list shell / note / footer),
 * nhưng không có tab Công ty — chỉ chọn đội (multi-select, khớp body teams[]).
 */

import UsersGroupIcon from '@/components/ui/users-group-icon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAssignCompanyTeam, useCompanyTeamOptions } from '@/hooks/useCompany';
import { createIdempotencyKeyStore } from '@/lib/api/idempotency';
import { cn } from '@/lib/utils';
import { getCompanyMutationError } from '@/utils/companyUi';
import { faClipboardList, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CompanyAssignTeamDialogProps {
  open: boolean;
  reportId: string | null;
  reportCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

type TeamOption = {
  id: string;
  name: string;
  memberCount: number;
};

function SelectionListShell({
  loading,
  emptyMessage,
  children,
  footer,
}: {
  loading: boolean;
  emptyMessage: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Đang tải...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overscroll-contain rounded-xl border border-border bg-background">
      {children ?? (
        <div className="flex h-full min-h-[200px] items-center justify-center px-5 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
      {footer}
    </div>
  );
}

function TeamRow({
  team,
  checked,
  onToggle,
}: {
  team: TeamOption;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 px-4 py-3.5 transition',
        checked ? 'bg-muted/70' : 'hover:bg-muted/40'
      )}
    >
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-foreground">
          <UsersGroupIcon size={16} className="text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{team.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {team.memberCount} thành viên
          </p>
        </div>
      </div>
    </label>
  );
}

export function CompanyAssignTeamDialog({
  open,
  reportId,
  reportCode,
  onClose,
  onSuccess,
}: CompanyAssignTeamDialogProps) {
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const assignIdempotencyKeyRef = useRef(createIdempotencyKeyStore());

  /** Chỉ gọi GET /v1/teams/company-teams khi mở dialog — chỉ đội active. */
  const { options: teams, isPending: teamsLoading } = useCompanyTeamOptions({
    enabled: open,
  });
  const assign = useAssignCompanyTeam();

  const resetForm = useCallback(() => {
    setSelectedTeamIds(new Set());
    setNote('');
    assignIdempotencyKeyRef.current.reset();
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const toggleTeam = (id: string) => {
    setSelectedTeamIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedTeams = useMemo(
    () => teams.filter(t => selectedTeamIds.has(t.id)),
    [teams, selectedTeamIds]
  );

  const isSubmitting = assign.isPending;
  const canSubmit = Boolean(reportId) && selectedTeamIds.size > 0 && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit || !reportId) return;

    const trimmedNote = note.trim();
    assign.mutate(
      {
        reportId,
        body: {
          teams: [...selectedTeamIds].map(teamId => ({
            teamId,
            ...(trimmedNote ? { note: trimmedNote } : {}),
          })),
        },
        idempotencyKey: assignIdempotencyKeyRef.current.get(reportId),
      },
      {
        onSuccess: () => {
          assignIdempotencyKeyRef.current.reset();
          toast.success(
            selectedTeamIds.size === 1
              ? 'Đã phân công đội xử lý'
              : `Đã phân công ${selectedTeamIds.size} đội xử lý`
          );
          onSuccess();
          handleClose();
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể phân công đội')),
      }
    );
  };

  return (
    <Dialog
      open={open && Boolean(reportId)}
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
            <FontAwesomeIcon
              icon={faClipboardList}
              className="size-4 shrink-0 text-foreground"
              aria-hidden
            />
            Phân công đội xử lý
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Chọn một hoặc nhiều đội dọn dẹp của công ty cho báo cáo{' '}
            <span className="font-medium text-foreground">{reportCode || '—'}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 flex-col gap-4 px-8 py-5">
          <div className="h-[240px] shrink-0">
            <SelectionListShell
              loading={teamsLoading}
              emptyMessage="Chưa có đội hoạt động. Tạo đội trước khi phân công."
            >
              {teams.length > 0 ? (
                <ul className="divide-y divide-border">
                  {teams.map(team => (
                    <li key={team.id}>
                      <TeamRow
                        team={team}
                        checked={selectedTeamIds.has(team.id)}
                        onToggle={() => toggleTeam(team.id)}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </SelectionListShell>
          </div>

          <div className="shrink-0">
            <label
              htmlFor="company-assign-note"
              className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              id="company-assign-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Yêu cầu cụ thể, deadline, lưu ý an toàn..."
              className="mt-2 h-18 w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-3 border-t border-border bg-muted/20 px-8 py-4 sm:justify-between sm:space-x-0">
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {selectedTeamIds.size === 0 ? (
              'Chưa chọn đội'
            ) : selectedTeamIds.size === 1 && selectedTeams[0] ? (
              <>
                Đội: <span className="font-medium text-foreground">{selectedTeams[0].name}</span>
              </>
            ) : (
              <>
                Đã chọn <span className="font-medium text-foreground">{selectedTeamIds.size}</span>{' '}
                đội
              </>
            )}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Huỷ
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <FontAwesomeIcon icon={faUserPlus} className="mr-1.5 size-3.5" aria-hidden />
              {isSubmitting ? 'Đang phân công...' : 'Phân công'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
