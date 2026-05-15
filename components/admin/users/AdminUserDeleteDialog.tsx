'use client';

import { AdminUserDialogShell } from '@/components/admin/users/AdminUserDialogShell';
import { useDeleteAdminUser } from '@/hooks/useAdminUsers';
import type { AdminUserItem } from '@/lib/api/services/fetchAdmin';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUserDeleteDialogProps {
  user: AdminUserItem | null;
  onClose: () => void;
}

export function AdminUserDeleteDialog({ user, onClose }: AdminUserDeleteDialogProps) {
  const deleteUser = useDeleteAdminUser();

  const onConfirm = () => {
    if (!user) return;
    deleteUser.mutate(user.id, {
      onSuccess: env => {
        toast.success(env.data?.message ?? env.message ?? 'Đã xóa người dùng');
        onClose();
      },
      onError: err => toast.error(getAdminUserMutationError(err, 'Không thể xóa người dùng')),
    });
  };

  return (
    <AdminUserDialogShell
      open={user != null}
      title="Xóa người dùng"
      titleId="admin-user-delete-title"
      onClose={onClose}
    >
      {user && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa mềm tài khoản{' '}
            <span className="font-semibold text-foreground">{user.fullName}</span> ({user.email})?
            Hành động này không thể hoàn tác từ giao diện quản trị.
          </p>
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
              onClick={onConfirm}
              disabled={deleteUser.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
            >
              {deleteUser.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Xóa
            </button>
          </div>
        </div>
      )}
    </AdminUserDialogShell>
  );
}
