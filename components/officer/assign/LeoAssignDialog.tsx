'use client';

import { AceternityTabs } from '@/components/ui/aceternity-tabs';
import { Modal, ModalBody, ModalContent, ModalFooter } from '@/components/ui/animated-modal';
import UsersGroupIcon from '@/components/ui/users-group-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useMyWardCompanies } from '@/hooks/useCompany';
import { useAssignReport, useDispatchReportToCompany } from '@/hooks/useOfficer';
import { TEAMS_ASSIGN_PAGE_SIZE, useTeamsInfiniteList } from '@/hooks/useTeams';
import type { MyWardCompanyItem } from '@/lib/api/models/company';
import type { TeamListItem } from '@/lib/api/services/fetchTeam';
import { toastApiError, toastApiSuccess } from '@/lib/api/toast';
import { cn } from '@/lib/utils';
import { faBuilding, faClipboardList, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Loader2 } from 'lucide-react';
import type { ReactNode, UIEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

interface LeoAssignDialogProps {
  open: boolean;
  onClose: () => void;
  reportIds: string[];
  onAssigned?: () => void;
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
}: {
  team: TeamListItem;
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
            {team.officeName} · {team.memberCount} thành viên
          </p>
        </div>
      </div>
    </label>
  );
}

/** LEO phân công — animated Modal + Aceternity tabs (Company | Cleanup Team). */
export function LeoAssignDialog({ open, onClose, reportIds, onAssigned }: LeoAssignDialogProps) {
  const assignMutation = useAssignReport();
  const dispatchMutation = useDispatchReportToCompany();
  const [activeTab, setActiveTab] = useState<AssignTab>('company');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [formKey, setFormKey] = useState(0);

  const resetForm = useCallback(() => {
    setActiveTab('company');
    setSelectedCompanyId(null);
    setSelectedTeamIds(new Set());
    setNote('');
    setFormKey(k => k + 1);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const { data: myWardData, isLoading: companiesLoading } = useMyWardCompanies({ enabled: open });
  const {
    data: teamsPages,
    isPending: teamsLoading,
    isFetchingNextPage: teamsFetchingNext,
    hasNextPage: teamsHasNext,
    fetchNextPage: fetchNextTeams,
  } = useTeamsInfiniteList(
    {
      pageSize: TEAMS_ASSIGN_PAGE_SIZE,
      teamType: 'Cleanup',
      isActive: true,
      isAvailable: true,
    },
    { enabled: open && activeTab === 'cleanup-team' }
  );

  const companies = myWardData?.companies ?? [];
  const teams = useMemo(
    () => teamsPages?.pages.flatMap(page => page.items) ?? [],
    [teamsPages?.pages]
  );

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

  const isSubmitting = assignMutation.isPending || dispatchMutation.isPending;

  const canSubmit =
    activeTab === 'company'
      ? Boolean(selectedCompanyId) && !isSubmitting
      : selectedTeamIds.size > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const trimmedNote = note.trim();

    try {
      if (activeTab === 'company' && selectedCompanyId) {
        const body = {
          companyId: selectedCompanyId,
          ...(trimmedNote ? { note: trimmedNote } : {}),
        };
        await Promise.all(
          reportIds.map(reportId => dispatchMutation.mutateAsync({ reportId, body }))
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
          reportIds.map(reportId => assignMutation.mutateAsync({ reportId, body }))
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

  const tabs = useMemo(
    () => [
      {
        title: 'Company',
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
        title: 'Cleanup Team',
        value: 'cleanup-team',
        content: (
          <SelectionListShell
            loading={teamsLoading}
            emptyMessage="Không có đội dọn dẹp cộng đồng đang sẵn sàng."
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
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </SelectionListShell>
        ),
      },
    ],
    [
      companies,
      companiesLoading,
      selectedCompanyId,
      selectedTeamIds,
      teams,
      teamsLoading,
      teamsFetchingNext,
      handleTeamsScroll,
    ]
  );

  return (
    <Modal
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen) handleClose();
      }}
      dismissible={!isSubmitting}
    >
      <ModalBody className="h-auto min-h-0 max-h-[90vh] w-full max-w-2xl flex-none overflow-hidden md:max-w-2xl">
        <ModalContent className="flex h-auto min-h-0 flex-none flex-col gap-0 overflow-hidden p-0 md:p-0">
          <div className="shrink-0 space-y-2 border-b border-border px-8 pb-4 pt-7 pr-14 text-left">
            <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground">
              <FontAwesomeIcon
                icon={faClipboardList}
                className="size-4 shrink-0 text-foreground"
                aria-hidden
              />
              Phân công xử lý
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Chọn công ty DVMT phục vụ phường/xã và đội dọn dẹp cộng đồng cho{' '}
              <span className="font-medium text-foreground">{reportIds.length}</span> báo cáo đã
              chọn.
            </p>
          </div>

          {/* Fixed slots — list không đẩy/che ghi chú; dialog không cần scroll. */}
          <div className="flex shrink-0 flex-col gap-4 px-8 py-5">
            <AceternityTabs
              key={formKey}
              tabs={tabs}
              onActiveChange={handleTabChange}
              containerClassName="shrink-0 rounded-full border border-border bg-muted/30 p-1"
              activeTabClassName="bg-muted"
              tabClassName="px-5 py-1.5"
              contentClassName="h-[200px] shrink-0"
            />

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
          </div>

          <ModalFooter className="shrink-0 flex-row items-center justify-between gap-3 border-t border-border bg-muted/20 px-8 py-4 sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {activeTab === 'company' ? (
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
                  Đã chọn{' '}
                  <span className="font-medium text-foreground">{selectedTeamIds.size}</span> đội
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
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                <FontAwesomeIcon icon={faUserPlus} className="mr-1.5 size-3.5" aria-hidden />
                {isSubmitting ? 'Đang phân công...' : 'Phân công'}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </ModalBody>
    </Modal>
  );
}
