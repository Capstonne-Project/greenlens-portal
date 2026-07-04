'use client';

import type { CreateCompanyStaffResult } from '@/lib/api/models/company';
import { Check, Copy, X } from 'lucide-react';
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

  if (!open || !result) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
      toast.success('Đã sao chép mật khẩu tạm');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép — vui lòng ghi lại thủ công');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="temp-password-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-amber-200 bg-card p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="temp-password-title" className="text-lg font-semibold text-amber-900">
              Mật khẩu tạm — chỉ hiển thị một lần
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gửi thông tin đăng nhập cho <strong>{result.fullName}</strong> qua kênh bảo mật.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <dl className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{result.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Mật khẩu tạm</dt>
            <dd className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded-md bg-background px-3 py-2 font-mono text-base font-semibold tracking-wide">
                {result.tempPassword}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted"
                aria-label="Sao chép mật khẩu"
              >
                {copied ? (
                  <Check className="size-4 text-emerald-700" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
              </button>
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Đã ghi lại, đóng
        </button>
      </div>
    </div>
  );
}
