'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import { useUpdateOffice } from '@/hooks/useOffices';
import type { OfficeListItem } from '@/lib/api/models/office';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const fieldClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40';

interface OfficeEditDialogProps {
  open: boolean;
  office: OfficeListItem | null;
  onClose: () => void;
  onSaved?: () => void;
}

function OfficeEditFormBody({
  office,
  onClose,
  onSaved,
}: {
  office: OfficeListItem;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [name, setName] = useState(office.name);
  const updateOffice = useUpdateOffice();

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Tên văn phòng không được để trống.');
      return;
    }
    updateOffice.mutate(
      { id: office.id, body: { name: trimmed } },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật tên văn phòng.');
          onSaved?.();
          onClose();
        },
        onError: err =>
          toast.error(getAdminUserMutationError(err, 'Không thể cập nhật văn phòng.')),
      }
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {office.departmentName} · {office.wardName}
      </p>
      <div className="space-y-1.5">
        <label htmlFor="office-edit-name" className="text-sm font-medium">
          Tên văn phòng
        </label>
        <input
          id="office-edit-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          Hủy
        </button>
        <button
          type="button"
          disabled={updateOffice.isPending}
          onClick={handleSave}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {updateOffice.isPending && <Loader2 className="size-4 animate-spin" />}
          Lưu
        </button>
      </div>
    </div>
  );
}

export function OfficeEditDialog({ open, office, onClose, onSaved }: OfficeEditDialogProps) {
  return (
    <OfficeDialogShell
      open={open}
      title="Sửa văn phòng"
      titleId="office-edit-title"
      onClose={onClose}
    >
      {office ? (
        <OfficeEditFormBody key={office.id} office={office} onClose={onClose} onSaved={onSaved} />
      ) : null}
    </OfficeDialogShell>
  );
}
