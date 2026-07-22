'use client';

import type { DepartmentListItem } from '@/lib/api/models/department';
import { Building2, Calendar, Eye, Landmark, MapPin, Pencil, Trash2 } from 'lucide-react';

function formatCreatedAt(iso: string): string {
  if (!iso?.trim() || iso.startsWith('0001-01-01')) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()) || d.getFullYear() <= 1) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

function provinceInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '—';
}

interface DepartmentsDataListProps {
  items: DepartmentListItem[];
  deactivatingId: string | null;
  isDeactivating: boolean;
  onDetail: (id: string) => void;
  onEdit: (dept: DepartmentListItem) => void;
  onDeactivate: (dept: DepartmentListItem) => void;
}

export function DepartmentsDataList({
  items,
  deactivatingId,
  isDeactivating,
  onDetail,
  onEdit,
  onDeactivate,
}: DepartmentsDataListProps) {
  const maxOffices = Math.max(1, ...items.map(d => d.officeCount));

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center text-muted-foreground">
        <Building2 className="mb-3 size-10 opacity-25" aria-hidden />
        <p className="text-sm">Không có đơn vị phù hợp bộ lọc hiện tại.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 p-3 sm:p-4" role="list">
      {items.map((row, index) => {
        const officePct = Math.round((row.officeCount / maxOffices) * 100);
        return (
          <li key={row.id}>
            <article
              className={`group relative overflow-hidden rounded-xl border bg-card transition-colors duration-200 hover:bg-muted/25 ${
                row.isActive ? 'border-border' : 'border-border/70 opacity-90'
              }`}
            >
              <span
                className={`absolute inset-y-2.5 left-0 w-0.5 rounded-full ${
                  row.isActive ? 'bg-teal-700/70' : 'bg-zinc-300'
                }`}
                aria-hidden
              />

              <div className="flex flex-col gap-4 py-4 pl-5 pr-4 sm:flex-row sm:items-center sm:gap-5 sm:py-3.5">
                <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-sm font-semibold tracking-wide text-zinc-700 ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700">
                    {provinceInitials(row.provinceName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate font-semibold text-foreground">{row.name}</h4>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          row.isActive
                            ? 'bg-teal-50 text-teal-800 ring-1 ring-teal-700/15 dark:bg-teal-950/50 dark:text-teal-300'
                            : 'bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {row.isActive ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3 shrink-0 text-zinc-400" aria-hidden />
                        {row.provinceName}
                        <span className="opacity-50">· {row.provinceCode}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3 shrink-0 text-zinc-400" aria-hidden />
                        {formatCreatedAt(row.createdAt)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-border/50 pt-3 sm:w-auto sm:shrink-0 sm:border-0 sm:pt-0">
                  <div className="flex min-w-[120px] flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Landmark className="size-3 text-zinc-400" aria-hidden />
                        Văn phòng
                      </span>
                      <span className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
                        {row.officeCount}
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                      role="presentation"
                      title={`${officePct}% so với đơn vị nhiều VP nhất trên trang`}
                    >
                      <div
                        className="h-full rounded-full bg-zinc-400 transition-all duration-500 dark:bg-zinc-500"
                        style={{ width: `${officePct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:duration-200 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button
                      type="button"
                      title="Chi tiết"
                      onClick={() => onDetail(row.id)}
                      className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      <Eye className="size-4" />
                    </button>
                    <button
                      type="button"
                      title="Sửa"
                      onClick={() => onEdit(row)}
                      className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      <Pencil className="size-4" />
                    </button>
                    {row.isActive ? (
                      <button
                        type="button"
                        title="Vô hiệu hóa"
                        disabled={deactivatingId === row.id && isDeactivating}
                        onClick={() => onDeactivate(row)}
                        className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <span
                className="pointer-events-none absolute right-3 top-2 font-mono text-[10px] text-muted-foreground/40 tabular-nums"
                aria-hidden
              >
                {String(index + 1).padStart(2, '0')}
              </span>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
