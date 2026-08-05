'use client';

import {
  usePresignAndUploadMedia,
  useUploadCommentImage,
  useUploadReportImage,
  useUploadReportVideo,
  type MediaPresignPurpose,
} from '@/hooks/useMedia';
import { Loader2, Upload } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { toast } from 'sonner';

const PURPOSE_OPTIONS: { value: MediaPresignPurpose; label: string }[] = [
  { value: 'ReportImage', label: 'ReportImage' },
  { value: 'ReportVideo', label: 'ReportVideo' },
  { value: 'BeforeImage', label: 'BeforeImage' },
  { value: 'ProgressImage', label: 'ProgressImage' },
  { value: 'AfterImage', label: 'AfterImage' },
  { value: 'CommentImage', label: 'CommentImage' },
  { value: 'EvidenceImage', label: 'EvidenceImage' },
];

type LastResult = {
  label: string;
  payload: string;
};

export function MediaUploadLab() {
  const [purpose, setPurpose] = useState<MediaPresignPurpose>('ReportImage');
  const [lastResult, setLastResult] = useState<LastResult | null>(null);

  const presignUpload = usePresignAndUploadMedia();
  const reportImage = useUploadReportImage();
  const reportVideo = useUploadReportVideo();
  const commentImage = useUploadCommentImage();

  const presignRef = useRef<HTMLInputElement>(null);
  const reportImageRef = useRef<HTMLInputElement>(null);
  const reportVideoRef = useRef<HTMLInputElement>(null);
  const commentImageRef = useRef<HTMLInputElement>(null);

  const onPickPresign = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    presignUpload.mutate(
      {
        input: {
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          mediaType: purpose,
        },
        file,
      },
      {
        onSuccess: data => {
          setLastResult({
            label: 'MED-01 presign + PUT R2',
            payload: JSON.stringify(data, null, 2),
          });
          toast.success('Presign + upload R2 thành công');
        },
        onError: err => {
          toast.error(err instanceof Error ? err.message : 'Presign/upload thất bại');
        },
      }
    );
  };

  const onPickReportImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    reportImage.mutate(file, {
      onSuccess: data => {
        setLastResult({
          label: 'MED-02 POST /media/reports/images',
          payload: JSON.stringify(data, null, 2),
        });
        toast.success('Upload ảnh báo cáo thành công');
      },
      onError: () => toast.error('Upload ảnh báo cáo thất bại'),
    });
  };

  const onPickReportVideo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    reportVideo.mutate(file, {
      onSuccess: data => {
        setLastResult({
          label: 'MED-03 POST /media/reports/videos',
          payload: JSON.stringify(data, null, 2),
        });
        toast.success('Upload video báo cáo thành công');
      },
      onError: () => toast.error('Upload video báo cáo thất bại'),
    });
  };

  const onPickCommentImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    commentImage.mutate(file, {
      onSuccess: data => {
        setLastResult({
          label: 'MED-04 POST /media/comments/images',
          payload: JSON.stringify(data, null, 2),
        });
        toast.success('Upload ảnh comment thành công');
      },
      onError: () => toast.error('Upload ảnh comment thất bại'),
    });
  };

  const isBusy =
    presignUpload.isPending ||
    reportImage.isPending ||
    reportVideo.isPending ||
    commentImage.isPending;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Trang thử nghiệm Media API (Admin / Company) — cần đăng nhập. Kiểm tra Network tab khi bấm
        từng nút.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-border dark:bg-card">
          <h3 className="text-sm font-bold text-foreground">MED-01 Presign → R2</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            POST /v1/media/presign + PUT uploadUrl
          </p>
          <label className="mt-3 block text-xs font-medium text-muted-foreground">mediaType</label>
          <select
            value={purpose}
            onChange={e => setPurpose(e.target.value as MediaPresignPurpose)}
            className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            {PURPOSE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            ref={presignRef}
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            onChange={onPickPresign}
          />
          <button
            type="button"
            disabled={isBusy}
            onClick={() => presignRef.current?.click()}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {presignUpload.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Chọn file & presign
          </button>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-border dark:bg-card">
          <h3 className="text-sm font-bold text-foreground">MED-02 Ảnh báo cáo (BE)</h3>
          <p className="mt-1 text-xs text-muted-foreground">POST /v1/media/reports/images</p>
          <input
            ref={reportImageRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onPickReportImage}
          />
          <button
            type="button"
            disabled={isBusy}
            onClick={() => reportImageRef.current?.click()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
          >
            {reportImage.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload ảnh báo cáo
          </button>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-border dark:bg-card">
          <h3 className="text-sm font-bold text-foreground">MED-03 Video báo cáo</h3>
          <p className="mt-1 text-xs text-muted-foreground">POST /v1/media/reports/videos</p>
          <input
            ref={reportVideoRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="sr-only"
            onChange={onPickReportVideo}
          />
          <button
            type="button"
            disabled={isBusy}
            onClick={() => reportVideoRef.current?.click()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
          >
            {reportVideo.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload video
          </button>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-border dark:bg-card">
          <h3 className="text-sm font-bold text-foreground">MED-04 Ảnh comment</h3>
          <p className="mt-1 text-xs text-muted-foreground">POST /v1/media/comments/images</p>
          <input
            ref={commentImageRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onPickCommentImage}
          />
          <button
            type="button"
            disabled={isBusy}
            onClick={() => commentImageRef.current?.click()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
          >
            {commentImage.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload ảnh comment
          </button>
        </div>
      </div>

      {lastResult && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-border dark:bg-muted/40">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Kết quả gần nhất — {lastResult.label}
          </p>
          <pre className="mt-2 max-h-64 overflow-auto text-xs leading-relaxed text-foreground">
            {lastResult.payload}
          </pre>
        </div>
      )}
    </div>
  );
}
