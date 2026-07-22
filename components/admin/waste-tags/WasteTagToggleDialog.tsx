'use client';

import { OfficeDialogShell } from '@/components/admin/offices/OfficeDialogShell';
import type { WasteTag } from '@/lib/api/models/wasteTag';
import { Loader2 } from 'lucide-react';

interface WasteTagToggleDialogProps {
  tag: WasteTag | null;
  /** true = bật lại, false = vô hiệu hóa */
  isActive: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function WasteTagToggleDialog({
  tag,
  isActive,
  busy,
  onClose,
  onConfirm,
}: WasteTagToggleDialogProps) {
  const deactivating = !isActive;

  return (
    <OfficeDialogShell
      open={tag != null}
      title={deactivating ? 'Vô hiệu hóa thẻ' : 'Kích hoạt thẻ'}
      titleId="admin-waste-tag-toggle-title"
      onClose={onClose}
    >
      {tag && (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {deactivating ? (
              <>
                Bạn có chắc muốn vô hiệu hóa{' '}
                <span className="font-semibold text-foreground">{tag.nameVi}</span> (
                <span className="font-mono text-xs">{tag.code}</span>)? Thẻ sẽ chuyển sang tab Đã
                tắt và có thể bật lại sau.
              </>
            ) : (
              <>
                Kích hoạt lại <span className="font-semibold text-foreground">{tag.nameVi}</span> (
                <span className="font-mono text-xs">{tag.code}</span>)? Thẻ sẽ hiện lại trên form
                báo cáo.
              </>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-60 ${
                deactivating
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {deactivating ? 'Vô hiệu hóa' : 'Kích hoạt'}
            </button>
          </div>
        </div>
      )}
    </OfficeDialogShell>
  );
}
