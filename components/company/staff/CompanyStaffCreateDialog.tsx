'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCompanyStaff } from '@/hooks/useCompany';
import type { CreateCompanyStaffResult } from '@/lib/api/models/company';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import { getCompanyMutationError } from '@/utils/companyUi';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

/** Mặc định khi UI không chọn chức vụ — BE vẫn yêu cầu `position`. */
const DEFAULT_POSITION = 'Staff';

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email')
    .max(254, 'Tối đa 254 ký tự')
    .email('Email không hợp lệ'),
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(160, 'Tối đa 160 ký tự'),
});

type FormValues = z.infer<typeof schema>;

interface CompanyStaffCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (result: CreateCompanyStaffResult) => void;
}

export function CompanyStaffCreateDialog({
  open,
  onClose,
  onCreated,
}: CompanyStaffCreateDialogProps) {
  const createStaff = useCreateCompanyStaff();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    ...REALTIME_FORM_OPTIONS,
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      fullName: '',
    },
  });

  const isBusy = createStaff.isPending;

  useEffect(() => {
    if (!open) {
      reset({
        email: '',
        fullName: '',
      });
    }
  }, [open, reset]);

  const closeDialog = () => {
    if (isBusy) return;
    reset({
      email: '',
      fullName: '',
    });
    onClose();
  };

  const onSubmit = handleSubmit(values => {
    createStaff.mutate(
      {
        email: values.email.trim(),
        fullName: values.fullName.trim(),
        position: DEFAULT_POSITION,
      },
      {
        onSuccess: env => {
          const data = env.data;
          if (data) {
            onCreated(data);
            closeDialog();
          } else {
            toast.success(env.message ?? 'Đã tạo tài khoản');
            closeDialog();
          }
        },
        onError: err => toast.error(getCompanyMutationError(err, 'Không thể tạo tài khoản')),
      }
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (!nextOpen && !isBusy) closeDialog();
      }}
    >
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        onInteractOutside={e => {
          if (isBusy) e.preventDefault();
        }}
        onEscapeKeyDown={e => {
          if (isBusy) e.preventDefault();
        }}
      >
        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="space-y-4 p-6 pb-8 md:p-8 md:pb-10">
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="flex items-center gap-2.5">
                <FontAwesomeIcon
                  icon={faUserPlus}
                  className="size-4 shrink-0 text-foreground"
                  aria-hidden
                />
                Tạo tài khoản
              </DialogTitle>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <div className="space-y-1">
                  <Label htmlFor="company-staff-email">Email</Label>
                  {!errors.email ? (
                    <FieldDescription>
                      Dùng để đăng nhập — lần đầu sẽ bắt buộc đổi mật khẩu
                    </FieldDescription>
                  ) : null}
                </div>
                <Input
                  id="company-staff-email"
                  type="email"
                  placeholder="vd: nguyenvana@example.com"
                  autoComplete="off"
                  autoFocus
                  disabled={isBusy}
                  maxLength={254}
                  {...register('email')}
                />
                <FieldError>{errors.email?.message}</FieldError>
              </Field>

              <Field>
                <Label htmlFor="company-staff-fullName">Họ và tên</Label>
                <Input
                  id="company-staff-fullName"
                  type="text"
                  placeholder="vd: Nguyễn Văn A"
                  disabled={isBusy}
                  maxLength={160}
                  {...register('fullName')}
                />
                <FieldError>{errors.fullName?.message}</FieldError>
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-slate-50 px-6 py-4 sm:space-x-0">
            <Button type="button" variant="outline" disabled={isBusy} onClick={closeDialog}>
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={isBusy}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
