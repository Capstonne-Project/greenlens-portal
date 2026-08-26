'use client';

import { AceternityTabs } from '@/components/ui/aceternity-tabs';
import { WasteTagBadge } from '@/components/common/WasteTagSelectChip';
import UsersGroupIcon from '@/components/ui/users-group-icon';
import { Badge } from '@/components/ui/badge';
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
import { useMyWardCompanies } from '@/hooks/useCompany';
import { useAssignReport, useDispatchReportToCompany, useReassignReport } from '@/hooks/useOfficer';
import { useReportDetail } from '@/hooks/useReport';
import { TEAMS_ASSIGN_PAGE_SIZE, useTeamsInfiniteList } from '@/hooks/useTeams';
import type { MyWardCompanyItem } from '@/lib/api/models/company';
import type { TeamListItem } from '@/lib/api/services/fetchTeam';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import { createIdempotencyKeyStore } from '@/lib/api/idempotency';
import { cn } from '@/lib/utils';
import { isReassignReasonValid, REASSIGN_REASON_MIN_LENGTH } from '@/utils/reportAssignments';
import { faBuilding, faClipboardList, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Check, Loader2 } from 'lucide-react';
import type { ReactNode, UIEvent } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

export type LeoAssignDialogMode = 'assign' | 'reassign';

export interface LeoReassignTarget {
  teamId: string;
  teamName?: string;
  /** Filter danh sách đội cùng loại (vd. Cleanup). */
  teamType?: string;
}

interface LeoAssignDialogProps {
  open: boolean;
  onClose: () => void;
  reportIds: string[];
  onAssigned?: () => void;
  /**
   * `assign` (mặc định): tab Công ty + Đội dọn dẹp.
   * `reassign`: chỉ đội LEO, loại trừ `oldTeam`, PUT /v1/reports/{id}/reassign.
   */
  mode?: LeoAssignDialogMode;
  /** Bắt buộc khi mode=reassign — đội hiện tại không hiện trong list. */
  oldTeam?: LeoReassignTarget | null;
  reportCode?: string;
}

const CONTRACT_TYPE_LABEL: Record<string, string> = {
  Subsidiary: 'Công ty trực thuộc',
  Bidding: 'Công ty đấu thầu',
};

type AssignTab = 'company' | 'cleanup-team';

function SelectionListShell({
  loading,
  emptyMessage,
  children,
  onScroll,
  footer,
}: {
  loading: boolean;
  emptyMessage: string;
  children: ReactNode;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
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
    <div
      className="h-full overflow-y-auto overscroll-contain rounded-xl border border-border bg-background"
      onScroll={onScroll}
    >
      {children ?? (
        <div className="flex h-full min-h-[200px] items-center justify-center px-5 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
      {footer}
    </div>
  );
}

function CompanyRow({
  company,
  checked,
  onToggle,
}: {
  company: MyWardCompanyItem;
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
          <FontAwesomeIcon icon={faBuilding} className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{company.name}</p>
            <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px] font-normal">
              {CONTRACT_TYPE_LABEL[company.contractType] ?? company.contractType}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {company.email} · {company.serviceAreaCount} địa bàn · {company.staffCount} nhân sự
          </p>
        </div>
      </div>
    </label>
  );
}

function TeamRow({
  team,
  checked,
  onToggle,
  matchedTagIds,
}: {
  team: TeamListItem;
  checked: boolean;
  onToggle: () => void;
  /** Set of tag IDs that match the report — empty khi không có reportId. */
  matchedTagIds: ReadonlySet<string>;
}) {
  const hasMatch = matchedTagIds.size > 0 && team.wasteTagMatchCount > 0;
  const hasTags = team.wasteTags.length > 0;

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
          <div className="flex items-center gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-foreground">{team.name}</p>
            {hasMatch && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Check className="size-3" />
                {team.wasteTagMatchCount} phù hợp
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {team.officeName} · {team.memberCount} thành viên
          </p>
          {hasTags ? (
            <div className="mt-1.5 flex flex-wrap gap-2">
              {team.wasteTags.map(tag => (
                <WasteTagBadge
                  key={tag.tagId}
                  tag={tag}
                  tone={
                    matchedTagIds.size === 0
                      ? 'default'
                      : matchedTagIds.has(tag.tagId)
                        ? 'match'
                        : 'muted'
                  }
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </label>
  );
}

/**
 * LEO phân công / phân công lại.
 * - assign: Aceternity tabs Công ty | Đội dọn dẹp
 * - reassign: chỉ đội LEO (không company), loại trừ oldTeam → PUT /reassign
 */
export function LeoAssignDialog({
  open,
  onClose,
  reportIds,
  onAssigned,
  mode = 'assign',
  oldTeam = null,
  reportCode,
}: LeoAssignDialogProps) {
  const isReassign = mode === 'reassign';
  const assignMutation = useAssignReport();
  const dispatchMutation = useDispatchReportToCompany();
  const reassignMutation = useReassignReport();

  const [activeTab, setActiveTab] = useState<AssignTab>(isReassign ? 'cleanup-team' : 'company');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [formKey, setFormKey] = useState(0);
  const assignIdempotencyKeysRef = useRef(createIdempotencyKeyStore());

  const oldTeamId = oldTeam?.teamId ?? '';
  const teamTypeFilter = (oldTeam?.teamType?.trim() ||
    (isReassign ? 'Cleanup' : 'Cleanup')) as string;

  /** Khi chỉ 1 báo cáo → truyền reportId để API sort theo wasteTagMatchCount desc. */
  const singleReportId = reportIds.length === 1 ? reportIds[0] : undefined;

  const { data: reportDetail } = useReportDetail(singleReportId ?? '', {
    enabled: open && Boolean(singleReportId),
  });

  /** Tag IDs của báo cáo — dùng để highlight tag trùng trên từng team. */
  const reportWasteTagIds = useMemo<ReadonlySet<string>>(() => {
    const tags = reportDetail?.wasteTags;
    if (!tags?.length) return new Set();
    return new Set(tags.map(t => t.tagId));
  }, [reportDetail?.wasteTags]);

  const resetForm = useCallback(() => {
    setActiveTab(isReassign ? 'cleanup-team' : 'company');
    setSelectedCompanyId(null);
    setSelectedTeamIds(new Set());
    setNote('');
    setReason('');
    setFormKey(k => k + 1);
    assignIdempotencyKeysRef.current.reset();
  }, [isReassign]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const { data: myWardData, isLoading: companiesLoading } = useMyWardCompanies({
    enabled: open && !isReassign,
  });
  const {
    data: teamsPages,
    isPending: teamsLoading,
    isFetchingNextPage: teamsFetchingNext,
    hasNextPage: teamsHasNext,
    fetchNextPage: fetchNextTeams,
  } = useTeamsInfiniteList(
    {
      pageSize: TEAMS_ASSIGN_PAGE_SIZE,
      teamType: teamTypeFilter,
      isActive: true,
      ...(singleReportId ? { reportId: singleReportId } : {}),
    },
    {
      enabled:
        open && (isReassign || activeTab === 'cleanup-team') && (!isReassign || Boolean(oldTeamId)),
    }
  );

  const companies = myWardData?.companies ?? [];
  const teams = useMemo(() => {
    const flat = teamsPages?.pages.flatMap(page => page.items) ?? [];
    if (!isReassign || !oldTeamId) return flat;
    return flat.filter(t => t.id !== oldTeamId);
  }, [teamsPages?.pages, isReassign, oldTeamId]);

  const handleTeamsScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const el = event.currentTarget;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
      if (nearBottom && teamsHasNext && !teamsFetchingNext) {
        void fetchNextTeams();
      }
    },
    [teamsHasNext, teamsFetchingNext, fetchNextTeams]
  );

  const handleTabChange = (value: string) => {
    if (isReassign) return;
    const tab = value as AssignTab;
    setActiveTab(tab);
    if (tab === 'company') setSelectedTeamIds(new Set());
    else setSelectedCompanyId(null);
  };

  const toggleCompany = (id: string) => {
    setSelectedCompanyId(prev => (prev === id ? null : id));
  };

  const toggleTeam = (id: string) => {
    setSelectedTeamIds(prev => {
      if (isReassign) {
        // PUT body.newTeamId — single select, không chọn lại oldTeam
        if (id === oldTeamId) return prev;
        if (prev.has(id)) return new Set();
        return new Set([id]);
      }
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCompany = useMemo(
    () => companies.find(c => c.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );

  const selectedTeam = useMemo(() => {
    const id = [...selectedTeamIds][0];
    return id ? (teams.find(t => t.id === id) ?? null) : null;
  }, [selectedTeamIds, teams]);

  const reasonOk = isReassignReasonValid(reason);
  const reasonLen = reason.trim().length;

  const isSubmitting =
    assignMutation.isPending || dispatchMutation.isPending || reassignMutation.isPending;

  const canSubmitAssign =
    activeTab === 'company'
      ? Boolean(selectedCompanyId) && !isSubmitting
      : selectedTeamIds.size > 0 && !isSubmitting;

  const newTeamId = selectedTeam?.id ?? '';
  const canSubmitReassign =
    Boolean(reportIds[0]) &&
    Boolean(oldTeamId) &&
    Boolean(newTeamId) &&
    newTeamId !== oldTeamId &&
    reasonOk &&
    !isSubmitting;

  const canSubmit = isReassign ? canSubmitReassign : canSubmitAssign;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (isReassign) {
      const reportId = reportIds[0];
      const newTeamId = selectedTeam?.id;
      if (!reportId || !oldTeamId || !newTeamId || newTeamId === oldTeamId) return;

      try {
        await reassignMutation.mutateAsync({
          reportId,
          body: {
            oldTeamId,
            newTeamId,
            reason: reason.trim(),
          },
        });
        toastApiSuccess(
          null,
          reportCode ? `Đã phân công lại báo cáo ${reportCode}.` : 'Đã phân công lại đội xử lý.'
        );
        onAssigned?.();
        handleClose();
      } catch (err) {
        toastApiError(
          err,
          'Không thể phân công lại. Kiểm tra loại đội / tải công việc và thử lại.'
        );
      }
      return;
    }

    const trimmedNote = note.trim();

    try {
      if (activeTab === 'company' && selectedCompanyId) {
        const body = {
          companyId: selectedCompanyId,
          ...(trimmedNote ? { note: trimmedNote } : {}),
        };
        await Promise.all(
          reportIds.map(reportId =>
            dispatchMutation.mutateAsync({
              reportId,
              body,
              idempotencyKey: assignIdempotencyKeysRef.current.get(reportId),
            })
          )
        );
        toastApiSuccess(
          null,
          reportIds.length === 1
            ? 'Đã điều phối báo cáo đến công ty DVMT.'
            : `Đã điều phối ${reportIds.length} báo cáo đến công ty DVMT.`
        );
      } else {
        const body = {
          teams: [...selectedTeamIds].map(teamId => ({
            teamId,
            ...(trimmedNote ? { note: trimmedNote } : {}),
          })),
        };
        await Promise.all(
          reportIds.map(reportId =>
            assignMutation.mutateAsync({
              reportId,
              body,
              idempotencyKey: assignIdempotencyKeysRef.current.get(reportId),
            })
          )
        );
        toastApiSuccess(
          null,
          reportIds.length === 1
            ? 'Đã phân công đội xử lý cho báo cáo.'
            : `Đã phân công đội xử lý cho ${reportIds.length} báo cáo.`
        );
      }
      onAssigned?.();
      handleClose();
    } catch (err) {
      toastApiError(
        err,
        activeTab === 'company'
          ? 'Không thể điều phối đến công ty. Vui lòng thử lại.'
          : 'Không thể phân công đội xử lý. Vui lòng thử lại.'
      );
    }
  };

  const teamsList = (
    <SelectionListShell
      loading={teamsLoading}
      emptyMessage={
        isReassign ? 'Không còn đội LEO khác để phân công lại.' : 'Không có đội dọn dẹp cộng đồng.'
      }
      onScroll={handleTeamsScroll}
      footer={
        teamsFetchingNext ? (
          <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Đang tải thêm...
          </div>
        ) : null
      }
    >
      {teams.length > 0 ? (
        <ul className="divide-y divide-border">
          {teams.map(team => (
            <li key={team.id}>
              <TeamRow
                team={team}
                checked={selectedTeamIds.has(team.id)}
                onToggle={() => toggleTeam(team.id)}
                matchedTagIds={reportWasteTagIds}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </SelectionListShell>
  );

  const tabs = useMemo(
    () => [
      {
        title: 'Công ty',
        value: 'company',
        content: (
          <SelectionListShell
            loading={companiesLoading}
            emptyMessage="Không có công ty DVMT phục vụ phường/xã này."
          >
            {companies.length > 0 ? (
              <ul className="divide-y divide-border">
                {companies.map(company => (
                  <li key={company.id}>
                    <CompanyRow
                      company={company}
                      checked={selectedCompanyId === company.id}
                      onToggle={() => toggleCompany(company.id)}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </SelectionListShell>
        ),
      },
      {
        title: 'Đội dọn dẹp',
        value: 'cleanup-team',
        content: teamsList,
      },
    ],
    // teamsList rebuilt each render — deps cover its inputs
    [
      companies,
      companiesLoading,
      selectedCompanyId,
      selectedTeamIds,
      teams,
      teamsLoading,
      teamsFetchingNext,
      handleTeamsScroll,
      isReassign,
      reportWasteTagIds,
    ]
  );

  return (
    <Dialog
      open={open}
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
            {isReassign ? 'Phân công lại đội xử lý' : 'Phân công xử lý'}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {isReassign ? (
              <>
                Chọn đội LEO thay thế
                {oldTeam?.teamName ? (
                  <>
                    {' '}
                    cho <span className="font-medium text-foreground">{oldTeam.teamName}</span>
                  </>
                ) : null}
                {reportCode ? (
                  <>
                    {' '}
                    trên báo cáo <span className="font-medium text-foreground">{reportCode}</span>
                  </>
                ) : null}
                . Đội cũ không hiển thị trong danh sách.
              </>
            ) : (
              <>
                Chọn công ty DVMT phục vụ phường/xã và đội dọn dẹp cộng đồng cho{' '}
                <span className="font-medium text-foreground">{reportIds.length}</span> báo cáo đã
                chọn.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 flex-col gap-4 px-8 py-5">
          {isReassign ? (
            <div className="h-[240px] shrink-0">{teamsList}</div>
          ) : (
            <AceternityTabs
              key={formKey}
              tabs={tabs}
              onActiveChange={handleTabChange}
              containerClassName="shrink-0 rounded-full bg-muted/30 p-1"
              activeTabClassName="bg-muted"
              tabClassName="px-5 py-1.5"
              contentClassName="h-[200px] shrink-0"
            />
          )}

          {isReassign ? (
            <div className="shrink-0">
              <label
                htmlFor="leo-reassign-reason"
                className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                Lý do phân công lại (bắt buộc, tối thiểu {REASSIGN_REASON_MIN_LENGTH} ký tự)
              </label>
              <textarea
                id="leo-reassign-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ví dụ: Đội trước từ chối vì đủ tải; chuyển sang đội khu vực gần hơn..."
                className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10"
              />
              <p
                className={cn(
                  'mt-1.5 text-[11px]',
                  reasonOk ? 'text-muted-foreground' : 'text-destructive'
                )}
              >
                {reasonLen}/{REASSIGN_REASON_MIN_LENGTH} ký tự tối thiểu
              </p>
            </div>
          ) : (
            <div className="shrink-0">
              <label
                htmlFor="assign-note"
                className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                Ghi chú (tuỳ chọn)
              </label>
              <textarea
                id="assign-note"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="Yêu cầu cụ thể, deadline, lưu ý an toàn..."
                className="mt-2 h-18 w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-foreground/30 focus:ring-1 focus:ring-foreground/10"
              />
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-3 border-t border-border bg-muted/20 px-8 py-4 sm:justify-between sm:space-x-0">
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {isReassign ? (
              selectedTeam ? (
                <>
                  Đội mới: <span className="font-medium text-foreground">{selectedTeam.name}</span>
                </>
              ) : (
                'Chưa chọn đội thay thế'
              )
            ) : activeTab === 'company' ? (
              selectedCompany ? (
                <>
                  Công ty:{' '}
                  <span className="font-medium text-foreground">{selectedCompany.name}</span>
                </>
              ) : (
                'Chưa chọn công ty'
              )
            ) : (
              <>
                Đã chọn <span className="font-medium text-foreground">{selectedTeamIds.size}</span>{' '}
                đội
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Huỷ
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={!canSubmit}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <FontAwesomeIcon icon={faUserPlus} className="mr-1.5 size-3.5" aria-hidden />
              {isSubmitting
                ? isReassign
                  ? 'Đang phân công lại...'
                  : 'Đang phân công...'
                : isReassign
                  ? 'Phân công lại'
                  : 'Phân công'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
