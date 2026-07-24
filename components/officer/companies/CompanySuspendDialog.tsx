'use client';

import { Ban, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { useSuspendCompany } from '@/hooks/useCompany';
import { cn } from '@/lib/utils';
import { getCompanyMutationError } from '@/utils/companyErrors';

const SUSPEND_REASON_MIN = 20;
const SUSPEND_REASON_MAX = 500;

export interface CompanySuspendTarget {
  id: string;
  name: string;
  contractNumber: string;
  taxCode?: string;
}

interface CompanySuspendDialogProps {
  open: boolean;
  company: CompanySuspendTarget | null;
  onClose: () => void;
  onSuspended?: () => void;
}

export function CompanySuspendDialog({
  open,
  company,
  onClose,
  onSuspended,
}: CompanySuspendDialogProps) {
  const suspendMutation = useSuspendCompany();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const reasonTrimmed = reason.trim();
  const isReasonValid =
    reasonTrimmed.length >= SUSPEND_REASON_MIN && reasonTrimmed.length <= SUSPEND_REASON_MAX;

  const resetForm = () => {
    setReason('');
    setReasonError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (suspendMutation.isPending) return;
    if (!nextOpen) {
      resetForm();
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!company) return;
    if (!isReasonValid) {
      setReasonError(
        reasonTrimmed.length < SUSPEND_REASON_MIN
          ? `Lý do tối thiểu ${SUSPEND_REASON_MIN} ký tự`
          : `Lý do tối đa ${SUSPEND_REASON_MAX} ký tự`
      );
      return;
    }

    suspendMutation.mutate(
      { id: company.id, body: { reason: reasonTrimmed } },
      {
        onSuccess: env => {
          toast.success(env.message || 'Đã tạm ngưng doanh nghiệp.');
          resetForm();
          onClose();
          window.setTimeout(() => onSuspended?.(), 0);
        },
        onError: err => {
          toast.error(getCompanyMutationError(err, 'Không thể tạm ngưng doanh nghiệp.'));
        },
      }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        key={company?.id ?? 'suspend-dialog'}
        className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-xl"
      >
        <AlertDialogHeader className="space-y-3 p-6 pb-4 text-left">
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600 ring-1 ring-orange-100"
              aria-hidden
            >
              <Ban className="size-5" />
            </div>
            <AlertDialogTitle className="text-left text-lg leading-snug">
              Tạm ngưng doanh nghiệp?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left text-sm leading-relaxed">
            Trạng thái chuyển sang <span className="font-medium text-slate-700">Tạm ngưng</span>.
            Các nhiệm vụ đang gán sẽ bị hủy; báo cáo liên quan được đưa về trạng thái đã xác minh.
            Bạn có thể kích hoạt lại sau.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 px-6 pb-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
            <p className="truncate text-sm font-semibold text-slate-900" title={company?.name}>
              {company?.name}
            </p>
            <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
              {company?.contractNumber ? (
                <div className="flex min-w-0 gap-1">
                  <dt className="shrink-0">Số HĐ</dt>
                  <dd className="truncate font-medium text-slate-700">{company.contractNumber}</dd>
                </div>
              ) : null}
              {company?.taxCode ? (
                <div className="flex min-w-0 gap-1">
                  <dt className="shrink-0">MST</dt>
                  <dd className="truncate font-medium text-slate-700">{company.taxCode}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div>
            <label
              htmlFor="company-suspend-reason"
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              Lý do tạm ngưng <span className="text-destructive">*</span>
            </label>
            <textarea
              id="company-suspend-reason"
              rows={3}
              value={reason}
              disabled={suspendMutation.isPending}
              placeholder="Ví dụ: Vi phạm điều khoản hợp đồng, tạm dừng vận hành theo yêu cầu Sở…"
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 disabled:opacity-60"
              onChange={e => {
                setReason(e.target.value);
                if (reasonError) setReasonError(null);
              }}
            />
            <div className="mt-1.5 flex items-start justify-between gap-2">
              {reasonError ? (
                <p className="text-xs text-destructive">{reasonError}</p>
              ) : (
                <p className="text-xs text-slate-500">Tối thiểu {SUSPEND_REASON_MIN} ký tự</p>
              )}
              <p className="shrink-0 text-xs tabular-nums text-slate-400">
                {reasonTrimmed.length}/{SUSPEND_REASON_MAX}
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="border-t border-slate-100 bg-slate-50/90 px-6 py-4 sm:justify-end">
          <AlertDialogCancel
            disabled={suspendMutation.isPending}
            className="mt-0 border-slate-200 bg-white"
          >
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: 'destructive' }), 'gap-1.5')}
            disabled={suspendMutation.isPending || !isReasonValid}
            onClick={e => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {suspendMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Đang tạm ngưng…
              </>
            ) : (
              'Xác nhận tạm ngưng'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
