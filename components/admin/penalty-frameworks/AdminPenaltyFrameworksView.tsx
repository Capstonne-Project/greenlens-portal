'use client';

import {
  PenaltyFrameworkCreateDialog,
  type PenaltyFrameworkFormValues,
} from '@/components/admin/penalty-frameworks/PenaltyFrameworkCreateDialog';
import {
  PenaltyFrameworkEditDialog,
  type PenaltyFrameworkEditFormValues,
} from '@/components/admin/penalty-frameworks/PenaltyFrameworkEditDialog';
import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TABLE_SHELL,
  adminTableCellPad,
} from '@/components/admin/shared/adminDataTableChrome';
import { PaginationSimple } from '@/components/ui/pagination';
import SaveIcon from '@/components/ui/save-icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCreatePenaltyFramework,
  usePenaltyFrameworksList,
  useTogglePenaltyFramework,
  useUpdatePenaltyFramework,
} from '@/hooks/usePenaltyFrameworks';
import { useCatalogPollutionCategories } from '@/hooks/usePollutionCategories';
import type {
  PenaltyFramework,
  PenaltyFrameworkPagination,
} from '@/lib/api/models/penaltyFramework';
import {
  PENALTY_FRAMEWORKS_PAGE_SIZE,
  PENALTY_VIOLATION_LEVEL_LABEL_VI,
  PENALTY_VIOLATION_LEVELS,
  type PenaltyViolationLevel,
} from '@/lib/constants/penaltyFrameworks';
import { cn } from '@/lib/utils';
import {
  formatPenaltyAmount,
  formatPenaltyAmountRange,
  getPenaltyMutationError,
  getPenaltyViolationBadgeClass,
} from '@/utils/penaltyFrameworkUi';
import { Filter, Loader2, Pencil, Plus, Power } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'active' | 'inactive';

type PenaltyColumnKey =
  | 'category'
  | 'violationLevel'
  | 'amount'
  | 'effective'
  | 'status'
  | 'created'
  | 'actions';

const FIRST_COL: PenaltyColumnKey = 'category';
const LAST_COL: PenaltyColumnKey = 'actions';

const COLUMN_DEFS: { key: PenaltyColumnKey; label: string; className?: string }[] = [
  { key: 'category', label: 'Loại ô nhiễm', className: 'w-[16%]' },
  { key: 'violationLevel', label: 'Cấp vi phạm', className: 'w-[12%]' },
  { key: 'amount', label: 'Mức phạt', className: 'w-[14%]' },
  { key: 'effective', label: 'Hiệu lực', className: 'w-[16%]' },
  { key: 'status', label: 'Trạng thái', className: 'w-[12%]' },
  { key: 'created', label: 'Ngày tạo', className: 'w-[12%]' },
  { key: 'actions', label: 'Thao tác', className: 'w-[14%]' },
];

function columnPad(colKey: PenaltyColumnKey, layer: 'head' | 'body' = 'body') {
  if (colKey === FIRST_COL) return adminTableCellPad('first', layer);
  if (colKey === LAST_COL) return adminTableCellPad('last', layer);
  return adminTableCellPad('middle', layer);
}

const EMPTY_PAGINATION: PenaltyFrameworkPagination = {
  page: 1,
  pageSize: PENALTY_FRAMEWORKS_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

function getViolationLabel(level: string): string {
  if ((PENALTY_VIOLATION_LEVELS as readonly string[]).includes(level)) {
    return PENALTY_VIOLATION_LEVEL_LABEL_VI[level as PenaltyViolationLevel];
  }
  return level || 'Không rõ';
}

function formatAdminDate(value: string | null | undefined): string {
  if (!value) return 'Không giới hạn';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function AdminPenaltyFrameworksView() {
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [violationLevel, setViolationLevel] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PenaltyFramework | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      page,
      pageSize: PENALTY_FRAMEWORKS_PAGE_SIZE,
      ...(categoryId ? { categoryId } : {}),
      ...(violationLevel ? { violationLevel } : {}),
      ...(status === 'active' ? { isActive: true } : {}),
      ...(status === 'inactive' ? { isActive: false } : {}),
    }),
    [categoryId, page, status, violationLevel]
  );

  const listQuery = usePenaltyFrameworksList(params);
  const categoriesQuery = useCatalogPollutionCategories();
  const createMutation = useCreatePenaltyFramework();
  const updateMutation = useUpdatePenaltyFramework();
  const toggleMutation = useTogglePenaltyFramework();

  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? EMPTY_PAGINATION;
  const categories = categoriesQuery.data ?? [];

  const activeOnPage = items.filter(item => item.isActive).length;
  const highestAmount = items.reduce((max, item) => Math.max(max, item.maxAmount), 0);

  const resetToFirstPage = () => setPage(1);

  const errorMessage =
    listQuery.error instanceof Error ? listQuery.error.message : 'Không tải được khung xử phạt.';

  const handleCreate = (values: PenaltyFrameworkFormValues) => {
    createMutation.mutate(
      {
        categoryId: values.categoryId,
        violationLevel: values.violationLevel,
        minAmount: values.minAmount,
        maxAmount: values.maxAmount,
        effectiveFrom: `${values.effectiveFrom}T00:00:00.000Z`,
        effectiveTo: values.effectiveTo?.trim() ? `${values.effectiveTo}T23:59:59.000Z` : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Đã tạo khung xử phạt.');
          setCreateOpen(false);
        },
        onError: err => toast.error(getPenaltyMutationError(err, 'Không thể tạo khung xử phạt.')),
      }
    );
  };

  const handleUpdate = (values: PenaltyFrameworkEditFormValues) => {
    if (!editTarget) return;
    updateMutation.mutate(
      {
        id: editTarget.id,
        body: {
          minAmount: values.minAmount,
          maxAmount: values.maxAmount,
          effectiveFrom: `${values.effectiveFrom}T00:00:00.000Z`,
          effectiveTo: values.effectiveTo?.trim() ? `${values.effectiveTo}T23:59:59.000Z` : null,
        },
      },
      {
        onSuccess: env => {
          toast.success(env.message || 'Đã cập nhật khung xử phạt.');
          setEditTarget(null);
        },
        onError: err =>
          toast.error(getPenaltyMutationError(err, 'Không thể cập nhật khung xử phạt.')),
      }
    );
  };

  const handleToggle = (item: PenaltyFramework) => {
    const activate = !item.isActive;
    setTogglingId(item.id);
    toggleMutation.mutate(
      { id: item.id, body: { activate } },
      {
        onSuccess: env => {
          toast.success(
            env.message || (activate ? 'Đã bật khung xử phạt.' : 'Đã tắt khung xử phạt.')
          );
        },
        onError: err =>
          toast.error(getPenaltyMutationError(err, 'Không thể đổi trạng thái khung xử phạt.')),
        onSettled: () => setTogglingId(null),
      }
    );
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Mức phạt theo loại ô nhiễm, cấp vi phạm và thời gian hiệu lực.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {pagination.totalItems.toLocaleString('vi-VN')}
            </span>{' '}
            khung · <span className="font-semibold text-foreground">{activeOnPage}</span> đang hiệu
            lực · cao nhất{' '}
            <span className="font-semibold text-foreground">
              {formatPenaltyAmount(highestAmount)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-800"
        >
          <Plus className="size-4" aria-hidden />
          Tạo khung phạt
        </button>
      </header>

      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_200px]">
            <div className="space-y-1.5">
              <label htmlFor="penalty-category-filter" className="text-sm font-medium">
                Loại ô nhiễm
              </label>
              <Select
                value={categoryId || 'all'}
                onValueChange={v => {
                  setCategoryId(v === 'all' ? '' : v);
                  resetToFirstPage();
                }}
              >
                <SelectTrigger id="penalty-category-filter" className="h-10 w-full rounded-lg">
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nameVi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="penalty-level-filter" className="text-sm font-medium">
                Cấp vi phạm
              </label>
              <Select
                value={violationLevel || 'all'}
                onValueChange={v => {
                  setViolationLevel(v === 'all' ? '' : v);
                  resetToFirstPage();
                }}
              >
                <SelectTrigger id="penalty-level-filter" className="h-10 w-full rounded-lg">
                  <SelectValue placeholder="Tất cả cấp" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="all">Tất cả cấp</SelectItem>
                  {PENALTY_VIOLATION_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>
                      {PENALTY_VIOLATION_LEVEL_LABEL_VI[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
              <Filter className="size-4 text-emerald-700" aria-hidden />
              Trạng thái
            </span>
            <div className="flex h-10 rounded-lg border border-border bg-background p-1">
              {(
                [
                  ['all', 'Tất cả'],
                  ['active', 'Đang hiệu lực'],
                  ['inactive', 'Ngưng'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setStatus(value);
                    resetToFirstPage();
                  }}
                  className={cn(
                    'rounded-md px-3 text-sm font-medium transition',
                    status === value
                      ? 'bg-emerald-700 text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className={ADMIN_TABLE_SHELL}>
        <div className={ADMIN_TABLE_SCROLL}>
          <Table className={ADMIN_TABLE_CLASS}>
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'bg-slate-100 hover:bg-slate-100')}>
                {COLUMN_DEFS.map(col => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      columnPad(col.key, 'head'),
                      ADMIN_TABLE_HEAD_CELL,
                      col.key === LAST_COL && 'text-right',
                      col.className
                    )}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isPending ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-slate-400" aria-hidden />
                  </TableCell>
                </TableRow>
              ) : listQuery.isError ? (
                <TableRow className={ADMIN_TABLE_ROW_BORDER}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <p className="text-sm text-destructive">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => void listQuery.refetch()}
                      className="mt-2 text-sm font-medium text-sky-700 hover:underline"
                    >
                      Thử lại
                    </button>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow className={cn(ADMIN_TABLE_ROW_BORDER, 'hover:bg-transparent')}>
                  <TableCell colSpan={COLUMN_DEFS.length} className="h-40 px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <SaveIcon size={32} className="opacity-30" />
                      <span>Chưa có khung xử phạt phù hợp.</span>
                      <span className="text-xs">
                        Hãy thử đổi bộ lọc hoặc tạo khung phạt mới cho danh mục đang dùng.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map(item => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      ADMIN_TABLE_ROW_BORDER,
                      'transition-[opacity,background-color] hover:bg-sky-50/40',
                      !item.isActive && 'opacity-60'
                    )}
                  >
                    <TableCell
                      className={cn(
                        columnPad('category', 'body'),
                        'align-middle',
                        COLUMN_DEFS[0].className
                      )}
                    >
                      <p className="font-semibold text-foreground">{item.categoryNameVi}</p>
                    </TableCell>
                    <TableCell
                      className={cn(
                        columnPad('violationLevel', 'body'),
                        'align-middle',
                        COLUMN_DEFS[1].className
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                          getPenaltyViolationBadgeClass(item.violationLevel)
                        )}
                      >
                        {getViolationLabel(item.violationLevel)}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        columnPad('amount', 'body'),
                        'align-middle',
                        COLUMN_DEFS[2].className
                      )}
                    >
                      <p className="text-base font-bold tracking-tight text-foreground">
                        {formatPenaltyAmountRange(item.minAmount, item.maxAmount, item.currency)}
                      </p>
                    </TableCell>
                    <TableCell
                      className={cn(
                        columnPad('effective', 'body'),
                        'align-middle',
                        COLUMN_DEFS[3].className
                      )}
                    >
                      <p className="font-medium text-foreground">
                        {formatAdminDate(item.effectiveFrom)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        đến {formatAdminDate(item.effectiveTo)}
                      </p>
                    </TableCell>
                    <TableCell
                      className={cn(
                        columnPad('status', 'body'),
                        'align-middle',
                        COLUMN_DEFS[4].className
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                          item.isActive
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {item.isActive ? 'Đang hiệu lực' : 'Ngưng'}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        columnPad('created', 'body'),
                        'align-middle text-sm text-muted-foreground',
                        COLUMN_DEFS[5].className
                      )}
                    >
                      {formatAdminDate(item.createdAt)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        columnPad('actions', 'body'),
                        'align-middle text-right',
                        COLUMN_DEFS[6].className
                      )}
                    >
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditTarget(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={togglingId === item.id}
                          onClick={() => handleToggle(item)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50',
                            item.isActive
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          )}
                        >
                          {togglingId === item.id ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          ) : (
                            <Power className="size-3.5" aria-hidden />
                          )}
                          {item.isActive ? 'Tắt' : 'Bật'}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!listQuery.isPending && !listQuery.isError ? (
          <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0">
              {pagination.totalPages > 1 ? (
                <PaginationSimple
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={p => setPage(p)}
                  className="w-auto"
                />
              ) : null}
            </div>
            <p className="shrink-0 text-xs text-slate-500 tabular-nums">
              {pagination.totalItems.toLocaleString('vi-VN')} rows
            </p>
          </div>
        ) : null}
      </div>

      <PenaltyFrameworkCreateDialog
        key={createOpen ? 'penalty-create-open' : 'penalty-create-closed'}
        open={createOpen}
        busy={createMutation.isPending}
        categories={categories}
        categoriesLoading={categoriesQuery.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <PenaltyFrameworkEditDialog
        key={editTarget?.id ?? 'penalty-edit-closed'}
        open={Boolean(editTarget)}
        framework={editTarget}
        busy={updateMutation.isPending}
        onClose={() => {
          if (!updateMutation.isPending) setEditTarget(null);
        }}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
