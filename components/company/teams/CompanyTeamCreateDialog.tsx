'use client';

import { ValidatedInput } from '@/components/common/ValidatedField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { useCreateCompanyTeam } from '@/hooks/useCompany';
import { REALTIME_FORM_OPTIONS } from '@/lib/validation/formDefaults';
import { getCompanyMutationError } from '@/utils/companyUi';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

/** Company chỉ có đội dọn dẹp — cố định trên UI (parity officer CreateTeamDialog). */
const COMPANY_TEAM_TYPE_LABEL = 'Đội Dọn dẹp';

const TEAM_NAME_MIN = 3;
const TEAM_NAME_MAX = 100;

const createCompanyTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên đội')
    .min(TEAM_NAME_MIN, `Tên đội phải có ít nhất ${TEAM_NAME_MIN} ký tự`)
    .max(TEAM_NAME_MAX, `Tên đội không được quá ${TEAM_NAME_MAX} ký tự`),
});

type CreateCompanyTeamFormValues = z.infer<typeof createCompanyTeamSchema>;

interface CompanyTeamCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CompanyTeamCreateDialog({ open, onClose }: CompanyTeamCreateDialogProps) {
  const createTeam = useCreateCompanyTeam();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateCompanyTeamFormValues>({
    ...REALTIME_FORM_OPTIONS,
    resolver: zodResolver(createCompanyTeamSchema),
    defaultValues: { name: '' },
  });

  const isBusy = createTeam.isPending;
  const nameValue = useWatch({ control, name: 'name', defaultValue: '' }) ?? '';

  const closeDialog = () => {
    reset({ name: '' });
    onClose();
  };

  const onSubmit = handleSubmit(values => {
    createTeam.mutate(
      { name: values.name },
      {
        onSuccess: env => {
          toast.success(env.message ?? 'Đã tạo đội mới.');
          closeDialog();
        },
        onError: err =>
          toast.error(getCompanyMutationError(err, 'Không thể tạo đội. Vui lòng thử lại.')),
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
          <div className="space-y-4 p-6 md:p-8">
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="flex items-center gap-2.5">
                <FontAwesomeIcon
                  icon={faUserGroup}
                  className="size-4 shrink-0 text-foreground"
                  aria-hidden
                />
                Tạo đội mới
              </DialogTitle>
              <DialogDescription>Tạo đội dọn dẹp trong công ty của bạn.</DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <Label>Loại đội</Label>
                <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm text-foreground">
                  <span
                    className="inline-block size-2.5 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden
                  />
                  <span className="font-medium">{COMPANY_TEAM_TYPE_LABEL}</span>
                </div>
              </Field>
              <Field>
                <Label htmlFor="company-create-team-name">Tên đội</Label>
                <FieldDescription>Ví dụ: Đội dọn dẹp khu vực A</FieldDescription>
                <ValidatedInput
                  id="company-create-team-name"
                  placeholder="Nhập tên đội"
                  disabled={isBusy}
                  {...register('name')}
                  value={nameValue}
                  minLength={TEAM_NAME_MIN}
                  maxLength={TEAM_NAME_MAX}
                  error={errors.name?.message}
                  className="h-9 rounded-md"
                />
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter className="gap-2 border-t border-border bg-slate-50 px-6 py-4 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={closeDialog}
              className="cursor-pointer"
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={isBusy}
              className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {isBusy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Đang tạo...
                </>
              ) : (
                'Tạo đội'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
