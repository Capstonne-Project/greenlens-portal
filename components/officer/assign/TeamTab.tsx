'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTeamsList } from '@/hooks/useTeams';
import { MoreHorizontal, Plus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TabToolbar } from './TabToolbar';

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

const TYPE_CLASS: Record<string, string> = {
  Cleanup: 'bg-green-50 text-green-600 ring-1 ring-green-200',
  Survey: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  Inspection: 'bg-purple-50 text-purple-600 ring-1 ring-purple-200',
};

const TYPE_LABEL: Record<string, string> = {
  Cleanup: 'Dọn dẹp',
  Survey: 'Khảo sát',
  Inspection: 'Kiểm tra',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {['s1', 's2', 's3', 's4', 's5'].map(key => (
        <TableRow key={key} className="animate-pulse">
          <TableCell className="px-5">
            <div className="size-4 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-36 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-5 w-20 rounded-full bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-48 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-8 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-5 w-20 rounded-full bg-muted" />
          </TableCell>
          <TableCell className="px-5">
            <div className="h-3 w-20 rounded bg-muted" />
          </TableCell>
          <TableCell className="px-5" />
        </TableRow>
      ))}
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TeamTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useTeamsList({ page, pageSize: PAGE_SIZE });

  const totalCount = data?.pagination.totalItems ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      t => t.name.toLowerCase().includes(q) || t.officeName.toLowerCase().includes(q)
    );
  }, [data?.items, search]);

  const allChecked = filtered.length > 0 && selected.size === filtered.length;
  const indeterminate = selected.size > 0 && selected.size < filtered.length;

  const toggleAll = () => {
    if (allChecked || indeterminate) setSelected(new Set());
    else setSelected(new Set(filtered.map(t => t.id)));
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().finally(() => setIsRefreshing(false));
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    setSelected(new Set());
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <TabToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Tìm tên đội, văn phòng..."
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        filterOpen={filterOpen}
        onFilterToggle={() => setFilterOpen(v => !v)}
        actionSlot={
          <Button variant="outline" size="sm">
            <Plus className="mr-1.5 size-4" />
            Thêm đội
          </Button>
        }
      />

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12 px-5">
              <Checkbox
                checked={indeterminate ? 'indeterminate' : allChecked}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Tên đội
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Loại
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Văn phòng quản lý
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Thành viên
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Trạng thái
            </TableHead>
            <TableHead className="px-5 text-xs font-semibold uppercase tracking-wide">
              Ngày tạo
            </TableHead>
            <TableHead className="w-12 px-5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <SkeletonRows />}
          {isError && (
            <TableRow>
              <TableCell colSpan={8} className="px-5 py-10 text-center text-destructive">
                Không thể tải dữ liệu. Vui lòng thử lại.
              </TableCell>
            </TableRow>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                Không có đội nào phù hợp.
              </TableCell>
            </TableRow>
          )}
          {!isLoading &&
            !isError &&
            filtered.map(team => (
              <TableRow
                key={team.id}
                onClick={() => toggleOne(team.id)}
                className={`cursor-pointer ${selected.has(team.id) ? 'bg-primary/5 hover:bg-primary/5' : ''}`}
              >
                <TableCell className="px-5" onClick={e => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(team.id)}
                    onCheckedChange={() => toggleOne(team.id)}
                  />
                </TableCell>
                <TableCell className="px-5 font-medium">{team.name}</TableCell>
                <TableCell className="px-5">
                  <Badge
                    variant="secondary"
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TYPE_CLASS[team.teamType]}`}
                  >
                    {TYPE_LABEL[team.teamType]}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 text-muted-foreground">{team.officeName}</TableCell>
                <TableCell className="px-5">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-3.5" />
                    <span>{team.memberCount}</span>
                  </div>
                </TableCell>
                <TableCell className="px-5">
                  {team.isActive ? (
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-600"
                    >
                      Hoạt động
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500"
                    >
                      Tạm dừng
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="px-5 text-muted-foreground">
                  {formatDate(team.createdAt)}
                </TableCell>
                <TableCell className="px-5" onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                      <DropdownMenuItem>Phân công thành viên</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        Vô hiệu hoá
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <span className="text-xs text-muted-foreground">
          {isLoading ? 'Đang tải...' : `${totalCount} đội`}
        </span>
        {totalPages > 1 && (
          <Pagination className="w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    if (page > 1) handlePageChange(page - 1);
                  }}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={e => {
                      e.preventDefault();
                      handlePageChange(p);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    if (page < totalPages) handlePageChange(page + 1);
                  }}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
