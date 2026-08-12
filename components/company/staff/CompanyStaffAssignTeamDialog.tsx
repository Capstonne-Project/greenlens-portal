'use client';

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
import { useAssignCompanyStaffTeam, useCompanyAllTeamOptions } from '@/hooks/useCompany';
import type { CompanyStaffItem } from '@/lib/api/models/company';
import { cn } from '@/lib/utils';
import { getCompanyMutationError } from '@/utils/companyUi';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const SELECT_MENU_OFFSET = 10;
const SELECT_COLLISION_PADDING = 24;

type TeamOption = {
  id: string;
  name: string;
  isActive: boolean;
  memberCount: number;
};

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function TeamSelectRow({
  team,
  className,
  compact = false,
}: {
  team: TeamOption;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-2.5', className)}>
      <Avatar className="size-7 shrink-0">
        <AvatarFallback className="bg-emerald-100 text-[10px] font-semibold text-emerald-800">
          {getInitials(team.name) || 'Đ'}
        </AvatarFallback>
      </Avatar>
      {compact ? (
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {team.name}
        </span>
      ) : (
        <span className="min-w-0 flex-1 text-left leading-tight">
          <span className="block min-w-0 truncate text-sm font-semibold text-foreground">
            {team.name}
          </span>
          <span className="mt-1 block text-[11px] text-muted-foreground">
            {team.memberCount} thành viên
          </span>
        </span>
      )}
    </div>
  );
}

interface CompanyStaffAssignTeamDialogProps {
  open: boolean;
  staff: CompanyStaffItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CompanyStaffAssignTeamDialog({
  open,
  staff,
  onClose,
  onSuccess,
}: CompanyStaffAssignTeamDialogProps) {
  const [teamId, setTeamId] = useState('');
  const [isLeader, setIsLeader] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamSelectOpen, setTeamSelectOpen] = useState(false);

  const { options: teams, isPending: teamsLoading } = useCompanyAllTeamOptions({
    enabled: open && Boolean(staff) && teamSelectOpen,
  });
  const assign = useAssignCompanyStaffTeam();

  const isBusy = assign.isPending;

  const selectableTeams = useMemo(() => {
    if (!staff) return [] as TeamOption[];
    return teams.filter(team => team.isActive && team.id !== staff.teamId);
  }, [staff, teams]);

  const selectedTeam = useMemo(
    () => selectableTeams.find(t => t.id === teamId) ?? null,
    [selectableTeams, teamId]
  );

  const handleClose = () => {
    if (isBusy) return;
    setTeamId('');
    setIsLeader(false);
    setTeamError(null);
    setTeamSelectOpen(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!staff) return;
    if (staff.teamId) {
      setTeamError('Thành viên đã thuộc đội. Hãy cho rời đội trước khi gán đội mới.');
      return;
    }
    if (!teamId) {
      setTeamError('Vui lòng chọn đội');
      return;
    }
    setTeamError(null);

    assign.mutate(
      {
        userId: staff.userId,
        teamId,
        currentTeamId: null,
        isLeader,
      },
      {
        onSuccess: () => {
          toast.success('Đã gán thành viên vào đội');
          onSuccess();
          handleClose();
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể gán đội')),
      }
    );
  };

  return (
    <Dialog
      open={open && Boolean(staff)}
      onOpenChange={nextOpen => {
        if (!nextOpen && !isBusy) handleClose();
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
          <div className="space-y-4 p-6 pb-8 md:p-8 md:pb-10">
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="flex items-center gap-2.5">
                <FontAwesomeIcon
                  icon={faUserGroup}
                  className="size-4 shrink-0 text-foreground"
                  aria-hidden
                />
                Gán đội
              </DialogTitle>
              <DialogDescription>
                Thành viên <span className="font-medium text-foreground">{staff?.fullName}</span>
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <Label htmlFor="assign-staff-team">Đội dọn dẹp</Label>
                <FieldDescription>
                  Chỉ hiển thị đội đang hoạt động — mở danh sách để tải
                </FieldDescription>
                <Select
                  value={teamId || undefined}
                  onValueChange={value => {
                    setTeamId(value);
                    setTeamError(null);
                  }}
                  open={teamSelectOpen}
                  onOpenChange={setTeamSelectOpen}
                  disabled={isBusy}
                >
                  <SelectTrigger
                    id="assign-staff-team"
                    className={cn(
                      'h-10 w-full gap-2 px-2.5 text-left',
                      '[&>span:not([class*="Icon"])]:flex [&>span:not([class*="Icon"])]:min-w-0',
                      '[&>span:not([class*="Icon"])]:flex-1 [&>span:not([class*="Icon"])]:items-center',
                      '[&>span:not([class*="Icon"])]:justify-start [&>span:not([class*="Icon"])]:overflow-hidden'
                    )}
                  >
                    {selectedTeam ? (
                      <span className="flex min-w-0 flex-1 items-center justify-start gap-2.5 overflow-hidden text-left">
                        <Avatar className="size-7 shrink-0">
                          <AvatarFallback className="bg-emerald-100 text-[10px] font-semibold text-emerald-800">
                            {getInitials(selectedTeam.name) || 'Đ'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm font-semibold text-foreground">
                          {selectedTeam.name}
                        </span>
                      </span>
                    ) : (
                      <SelectValue placeholder="Chọn đội" />
                    )}
                  </SelectTrigger>
                  <SelectContent
                    side="top"
                    sideOffset={SELECT_MENU_OFFSET}
                    collisionPadding={SELECT_COLLISION_PADDING}
                    className={cn(
                      'max-h-72 w-[var(--radix-select-trigger-width)] overflow-hidden p-0',
                      '[&>button]:hidden',
                      '[&_[data-radix-select-viewport]]:max-h-[min(18rem,var(--radix-select-content-available-height))]',
                      '[&_[data-radix-select-viewport]]:h-auto',
                      '[&_[data-radix-select-viewport]]:overflow-y-auto [&_[data-radix-select-viewport]]:overscroll-contain',
                      '[&_[data-radix-select-viewport]]:p-1'
                    )}
                  >
                    {teamsLoading ? (
                      <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Đang tải danh sách đội…
                      </div>
                    ) : selectableTeams.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        Chưa có đội đang hoạt động phù hợp
                      </div>
                    ) : (
                      selectableTeams.map(team => (
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
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FieldError>{teamError}</FieldError>
              </Field>

              <Field orientation="horizontal">
                <Label htmlFor="assign-is-leader" className="font-normal">
                  Trưởng nhóm
                </Label>
                <Switch
                  id="assign-is-leader"
                  checked={isLeader}
                  onCheckedChange={setIsLeader}
                  disabled={isBusy || !teamId}
                />
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-slate-50 px-6 py-4 sm:space-x-0">
            <Button type="button" variant="outline" disabled={isBusy} onClick={handleClose}>
              Huỷ
            </Button>
            <Button
              type="button"
              disabled={isBusy || !teamId}
              onClick={handleSubmit}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Gán đội'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
