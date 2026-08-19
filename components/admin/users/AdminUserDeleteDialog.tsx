'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useDeleteAdminUser } from '@/hooks/useAdminUsers';
import type { AdminUser } from '@/lib/api/models/adminUser';
import { getAdminUserMutationError } from '@/utils/adminUserErrors';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUserDeleteDialogProps {
  user: AdminUser | null;
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
    <AlertDialog open={user != null} onOpenChange={nextOpen => { if (!nextOpen) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa người dùng</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa mềm tài khoản{' '}
            <span className="font-semibold text-foreground">{user?.fullName}</span> ({user?.email})?
            Hành động này không thể hoàn tác từ giao diện quản trị.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleteUser.isPending}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={deleteUser.isPending}
          >
            {deleteUser.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Xóa
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
