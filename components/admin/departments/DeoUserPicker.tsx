'use client';

import { useDeoUsers } from '@/hooks/useDepartments';
import type { AdminUser } from '@/lib/api/models/adminUser';
import { roleDisplayVi } from '@/utils/adminUserUi';

const fieldClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

interface DeoUserPickerProps {
  enabled: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  selectedUser: AdminUser | null;
  onSelect: (user: AdminUser) => void;
  inputId?: string;
}

export function DeoUserPicker({
  enabled,
  search,
  onSearchChange,
  selectedUser,
  onSelect,
  inputId = 'deo-user-search',
}: DeoUserPickerProps) {
  const { data: items = [], isPending } = useDeoUsers(search, enabled);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-sm font-medium">
          Chọn DEO điều phối
        </label>
        <p className="text-xs text-muted-foreground">
          Chỉ hiển thị người dùng có role DEO (Cán bộ sở).
        </p>
        <input
          id={inputId}
          type="search"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Email, họ tên..."
          className={fieldClass}
          disabled={!enabled}
        />
      </div>
      <div className="max-h-36 overflow-y-auto rounded-lg border border-border">
        {isPending && (
          <p className="p-3 text-sm text-muted-foreground">Đang tải danh sách DEO...</p>
        )}
        {!isPending && items.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">
            Không có DEO phù hợp. Tạo hoặc gán role DEO trong Quản lý người dùng trước.
          </p>
        )}
        <ul>
          {items.map(u => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => onSelect(u)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted/50 ${
                  selectedUser?.id === u.id ? 'bg-emerald-50' : ''
                }`}
              >
                <span>
                  <span className="font-medium">{u.fullName}</span>
                  <span className="block text-xs text-muted-foreground">{u.email}</span>
                </span>
                <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900">
                  {roleDisplayVi(u.role)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {selectedUser && (
        <p className="text-sm">
          Đã chọn: <strong>{selectedUser.fullName}</strong>
        </p>
      )}
    </div>
  );
}
