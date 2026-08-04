'use client';

import { useExportMyData, useSubmitUserConsent } from '@/hooks/useUserPrivacy';
import { resolveApiToastMessage } from '@/utils/apiToastMessage';
import { Download, Loader2, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const CONSENT_VERSION = '1.0';

export function UserPrivacySection() {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptDataProcessing, setAcceptDataProcessing] = useState(false);

  const consentMutation = useSubmitUserConsent();
  const exportMutation = useExportMyData();

  const canSubmitConsent = acceptTerms && acceptPrivacy && acceptDataProcessing;

  const onSubmitConsent = () => {
    if (!canSubmitConsent) {
      toast.error('Bạn cần đồng ý đủ 3 mục để ghi nhận consent (BR-DAT-005)');
      return;
    }

    consentMutation.mutate(
      {
        acceptTerms,
        acceptPrivacyPolicy: acceptPrivacy,
        acceptDataProcessing,
        consentVersion: CONSENT_VERSION,
      },
      {
        onSuccess: result => {
          toast.success(resolveApiToastMessage(result.message, 'Đã ghi nhận đồng ý xử lý dữ liệu'));
        },
        onError: () => {
          toast.error('Không ghi nhận được consent. Vui lòng thử lại.');
        },
      }
    );
  };

  const onExport = () => {
    exportMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đã tải bản export dữ liệu cá nhân');
      },
      onError: () => {
        toast.error('Không export được dữ liệu. Vui lòng thử lại.');
      },
    });
  };

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-5 dark:border-border dark:bg-card sm:p-6">
      <div className="flex items-start gap-3 border-b border-emerald-100 pb-4 dark:border-border">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Shield className="size-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Quyền riêng tư & dữ liệu
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Consent xử lý dữ liệu (BR-DAT-005) và export dữ liệu cá nhân.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-100 p-3 dark:border-border">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={e => setAcceptTerms(e.target.checked)}
            className="mt-0.5 size-4 rounded border-input"
          />
          <span className="text-sm leading-6 text-foreground">
            Tôi đồng ý với <strong>Điều khoản sử dụng</strong> GreenLens.
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-100 p-3 dark:border-border">
          <input
            type="checkbox"
            checked={acceptPrivacy}
            onChange={e => setAcceptPrivacy(e.target.checked)}
            className="mt-0.5 size-4 rounded border-input"
          />
          <span className="text-sm leading-6 text-foreground">
            Tôi đồng ý với <strong>Chính sách quyền riêng tư</strong>.
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-100 p-3 dark:border-border">
          <input
            type="checkbox"
            checked={acceptDataProcessing}
            onChange={e => setAcceptDataProcessing(e.target.checked)}
            className="mt-0.5 size-4 rounded border-input"
          />
          <span className="text-sm leading-6 text-foreground">
            Tôi cho phép xử lý dữ liệu cá nhân (ảnh, GPS khi báo cáo) theo BR-DAT-005.
          </span>
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onSubmitConsent}
          disabled={!canSubmitConsent || consentMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50"
        >
          {consentMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Đang gửi…
            </>
          ) : (
            'Ghi nhận consent'
          )}
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={exportMutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:pointer-events-none disabled:opacity-50 dark:border-border dark:bg-muted dark:text-foreground"
        >
          {exportMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Đang export…
            </>
          ) : (
            <>
              <Download className="size-4" aria-hidden />
              Export dữ liệu của tôi
            </>
          )}
        </button>
      </div>

      {consentMutation.data?.consentedAt && (
        <p className="mt-3 text-xs text-muted-foreground">
          Consent gần nhất: {new Date(consentMutation.data.consentedAt).toLocaleString('vi-VN')}
        </p>
      )}
    </section>
  );
}
