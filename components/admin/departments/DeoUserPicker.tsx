'use client';

import { ValidatedSearchInput } from '@/components/common/ValidatedField';
import { Button } from '@/components/ui/button';
import { SEARCH_INPUT_MAX_LENGTH } from '@/lib/validation/formDefaults';
import { useDeoUsers } from '@/hooks/useDepartments';
import type { AdminUser } from '@/lib/api/models/adminUser';
import { roleDisplayVi } from '@/utils/adminUserUi';

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
        <ValidatedSearchInput
          id={inputId}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          maxLength={SEARCH_INPUT_MAX_LENGTH}
          placeholder="Email, họ tên..."
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
              <Button
                type="button"
                variant="ghost"
                onClick={() => onSelect(u)}
                className={`h-auto w-full justify-between px-3 py-2.5 text-left text-sm font-normal hover:bg-muted/50 ${
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
              </Button>
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
