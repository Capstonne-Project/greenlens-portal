'use client';

import { ValidatedSearchInput } from '@/components/common/ValidatedField';
import { SEARCH_INPUT_MAX_LENGTH } from '@/lib/validation/formDefaults';
import { useUnassignedLeoUsers } from '@/hooks/useOffices';
import type { AdminUser } from '@/lib/api/models/adminUser';
import { roleDisplayVi } from '@/utils/adminUserUi';

interface LeoUserPickerProps {
  enabled: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  selectedUser: AdminUser | null;
  onSelect: (user: AdminUser) => void;
  inputId?: string;
}

export function LeoUserPicker({
  enabled,
  search,
  onSearchChange,
  selectedUser,
  onSelect,
  inputId = 'leo-user-search',
}: LeoUserPickerProps) {
  const { items, isPending } = useUnassignedLeoUsers(search, enabled);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-sm font-medium">
          Chọn LEO phụ trách
        </label>
        <p className="text-xs text-muted-foreground">
          Chỉ hiển thị cán bộ có role LEO chưa được gán văn phòng.
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
          <p className="p-3 text-sm text-muted-foreground">Đang tải danh sách LEO...</p>
        )}
        {!isPending && items.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">
            Không có LEO trống phù hợp. Tạo hoặc giải phóng cán bộ LEO trước.
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
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
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
