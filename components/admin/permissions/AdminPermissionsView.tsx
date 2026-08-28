'use client';

import { ADMIN_TOOLBAR_CONTROL } from '@/components/admin/shared/adminUiTokens';
import {
  ADMIN_TABLE_CLASS,
  ADMIN_TABLE_HEAD_CELL,
  ADMIN_TABLE_ROW_BORDER,
  ADMIN_TABLE_SCROLL,
  ADMIN_TABLE_SHELL,
  adminTableCellPad,
} from '@/components/admin/shared/adminDataTableChrome';
import { AdminRetryButton } from '@/components/admin/shared/AdminRetryButton';
import { Button } from '@/components/ui/button';
import { useAdminPermissionsList } from '@/hooks/useAdminPermissions';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, Shield } from 'lucide-react';
import { useMemo } from 'react';

export function AdminPermissionsView() {
  const { data, isPending, isError, refetch, isFetching } = useAdminPermissionsList();

  const grouped = useMemo(() => {
    const items = data?.items ?? [];
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const moduleName = item.module || 'Khác';
      const list = map.get(moduleName) ?? [];
      list.push(item);
      map.set(moduleName, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'vi'));
  }, [data?.items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Ma trận quyền hệ thống — chỉ xem, không chỉnh sửa.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          className={cn(ADMIN_TOOLBAR_CONTROL, 'gap-2')}
        >
          <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} aria-hidden />
          Làm mới
        </Button>
      </div>

      {isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Không tải được danh sách quyền. <AdminRetryButton onClick={() => void refetch()} />
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
          <Shield className="size-10 opacity-30" aria-hidden />
          <p className="text-sm">Chưa có dữ liệu quyền.</p>
        </div>
      ) : (
        grouped.map(([moduleName, items]) => (
          <div key={moduleName} className={ADMIN_TABLE_SHELL}>
            <header className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold">{moduleName}</h2>
              <p className="text-xs text-muted-foreground">{items.length} quyền</p>
            </header>
            <div className={ADMIN_TABLE_SCROLL}>
              <table className={ADMIN_TABLE_CLASS}>
                <thead>
                  <tr className={ADMIN_TABLE_ROW_BORDER}>
                    <th className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('first', 'head'))}>
                      Key
                    </th>
                    <th className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('middle', 'head'))}>
                      Action
                    </th>
                    <th className={cn(ADMIN_TABLE_HEAD_CELL, adminTableCellPad('last', 'head'))}>
                      Mô tả
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr
                      key={item.key || `${item.module}-${item.action}`}
                      className={ADMIN_TABLE_ROW_BORDER}
                    >
                      <td className={cn(adminTableCellPad('first'), 'font-mono text-xs')}>
                        {item.key || '—'}
                      </td>
                      <td className={adminTableCellPad('middle')}>{item.action || '—'}</td>
                      <td className={cn(adminTableCellPad('last'), 'text-muted-foreground')}>
                        {item.description || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
