'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTeamsList } from '@/hooks/useTeams';
import type { TeamListItem } from '@/lib/api/services/fetchTeam';
import { Loader2, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AssignTeamDialogProps {
  open: boolean;
  onClose: () => void;
  reportCount: number;
  onSubmit: (teamIds: string[], note: string) => Promise<void> | void;
  submitting: boolean;
}

const TEAM_TYPE_LABEL: Record<string, string> = {
  Cleanup: 'Dọn dẹp',
  Inspection: 'Kiểm tra',
  Response: 'Ứng phó',
  Monitoring: 'Giám sát',
};

export function AssignTeamDialog({
  open,
  onClose,
  reportCount,
  onSubmit,
  submitting,
}: AssignTeamDialogProps) {
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');

  const { data, isLoading } = useTeamsList({
    page: 1,
    pageSize: 50,
    isActive: true,
    isAvailable: true,
  });
  const teams: TeamListItem[] = data?.items ?? [];

  // Reset state khi dialog đóng
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTeamIds(new Set());
      setNote('');
    }
  }, [open]);

  if (!open) return null;

  const toggleTeam = (id: string) => {
    setSelectedTeamIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSubmit = selectedTeamIds.size > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    void onSubmit([...selectedTeamIds], note.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Phân công đội xử lý</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Chọn đội để phân công cho{' '}
              <span className="font-semibold text-foreground">{reportCount}</span> báo cáo đã chọn.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Teams list */}
        <div className="max-h-96 min-h-0 overflow-y-auto px-5 py-3">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Đang tải danh sách đội...
            </div>
          )}

          {!isLoading && teams.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Không có đội nào đang hoạt động.
            </div>
          )}

          {!isLoading && teams.length > 0 && (
            <ul className="divide-y divide-border">
              {teams.map(team => {
                const checked = selectedTeamIds.has(team.id);
                return (
                  <li key={team.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-3 transition ${
                        checked ? 'bg-emerald-50/60' : 'hover:bg-muted/40'
                      }`}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleTeam(team.id)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {team.name}
                          </p>
                          <Badge
                            variant="outline"
                            className="rounded-full border-emerald-200 bg-emerald-50 px-2 py-0 text-[10px] font-medium text-emerald-700"
                          >
                            {TEAM_TYPE_LABEL[team.teamType] ?? team.teamType}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {team.officeName}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="size-3" />
                        {team.memberCount}
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Note */}
        <div className="border-t border-border px-5 py-3">
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
            rows={3}
            placeholder="Yêu cầu cụ thể, deadline, lưu ý an toàn..."
            className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Đã chọn <span className="font-semibold text-foreground">{selectedTeamIds.size}</span>{' '}
            đội
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Huỷ
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <UserPlus className="mr-1.5 size-4" />
              {submitting ? 'Đang phân công...' : 'Phân công'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
