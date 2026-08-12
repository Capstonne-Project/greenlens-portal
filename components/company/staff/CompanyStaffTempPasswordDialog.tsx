'use client';

import { SuccessDialog } from '@/components/common/SuccessDialog';
import { Button } from '@/components/ui/button';
import type { CreateCompanyStaffResult } from '@/lib/api/models/company';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CompanyStaffTempPasswordDialogProps {
  open: boolean;
  result: CreateCompanyStaffResult | null;
  onClose: () => void;
}

export function CompanyStaffTempPasswordDialog({
  open,
  result,
  onClose,
}: CompanyStaffTempPasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
      toast.success('Đã sao chép mật khẩu tạm');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép — vui lòng ghi lại thủ công');
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setCopied(false);
      onClose();
    }
  };

  return (
    <SuccessDialog
      open={open && Boolean(result)}
      onOpenChange={handleOpenChange}
      accent="emerald"
      title="Tạo tài khoản thành công"
      description={
        <p className="text-balance">
          Đã cấp tài khoản cho{' '}
          <span className="font-semibold text-foreground">{result?.fullName}</span>. Mật khẩu tạm
          chỉ hiện một lần — lần đăng nhập đầu phải đổi mật khẩu.
        </p>
      }
      secondaryAction={{
        label: copied ? 'Đã sao chép' : 'Sao chép mật khẩu',
        onClick: () => void handleCopy(),
      }}
      primaryAction={{
        label: 'Đóng',
        onClick: () => handleOpenChange(false),
      }}
    >
      {result ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm">
          <div className="space-y-1 border-b border-border px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </p>
            <p className="break-all text-sm font-medium text-foreground">{result.email}</p>
          </div>

          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Mật khẩu tạm
              </p>
              <p className="truncate font-mono text-base font-semibold tracking-wide text-foreground">
                {result.tempPassword}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-9 shrink-0"
              onClick={() => void handleCopy()}
              aria-label={copied ? 'Đã sao chép mật khẩu' : 'Sao chép mật khẩu'}
            >
              {copied ? (
                <Check className="size-4 text-emerald-600" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </SuccessDialog>
  );
}
