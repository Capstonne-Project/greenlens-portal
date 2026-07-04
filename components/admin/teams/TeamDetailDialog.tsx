'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useTeamDetail } from '@/hooks/useTeams';
import { getTeamTypeClasses, getTeamTypeLabel } from '@/lib/constants/adminTeams';
import { Loader2, Mail, ShieldCheck, UserRound } from 'lucide-react';

interface TeamDetailDialogProps {
  open: boolean;
  teamId: string | null;
  onClose: () => void;
}

function formatDate(iso: string): string {
  if (!iso?.trim() || iso.startsWith('0001-01-01')) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

export function TeamDetailDialog({ open, teamId, onClose }: TeamDetailDialogProps) {
  const { data, isPending, isError } = useTeamDetail(open ? teamId : null);

  return (
    <OfficeDialogShell
      open={open}
      title="Chi tiết đội môi trường"
      titleId="team-detail-title"
      onClose={onClose}
      size="xl"
    >
      {isPending && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <p className="py-8 text-center text-sm text-destructive">Không tải được chi tiết team.</p>
      )}

      {data && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-background p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  {data.officeName}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                  {data.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tạo {formatDate(data.createdAt)}
                  {data.updatedAt ? ` · cập nhật ${formatDate(data.updatedAt)}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getTeamTypeClasses(
                    data.teamType
                  )}`}
                >
                  {getTeamTypeLabel(data.teamType)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    data.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {data.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                </span>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold">Thành viên ({data.members.length})</h4>
              <span className="text-xs text-muted-foreground">
                Leader được đánh dấu bằng khiên xanh
              </span>
            </div>

            {data.members.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <UserRound className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">Team chưa có thành viên</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Khi API phân công thành viên sẵn sàng, danh sách sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.members.map(member => (
                  <article
                    key={member.userId}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                        {member.fullName.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{member.fullName}</p>
                          {member.isLeader ? (
                            <ShieldCheck className="size-4 shrink-0 text-emerald-700" />
                          ) : null}
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="size-3.5" />
                          <span className="truncate">{member.email}</span>
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Tham gia {formatDate(member.joinedAt)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </OfficeDialogShell>
  );
}
