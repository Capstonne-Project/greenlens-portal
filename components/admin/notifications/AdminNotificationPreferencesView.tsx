'use client';

import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/useNotification';
import type { NotificationPreference } from '@/lib/api/models/notification';
import { cn } from '@/lib/utils';
import {
  ADMIN_NOTIFICATION_TYPES,
  getNotificationMutationError,
  isAdminRelevantNotificationType,
  notificationTypeLabel,
} from '@/utils/notificationUi';
import { AlertTriangle, ArrowLeft, Loader2, RefreshCw, Save } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

function clonePreferences(list: NotificationPreference[]): NotificationPreference[] {
  return list.map(p => ({ ...p }));
}

export function AdminNotificationPreferencesView() {
  const { data, isPending, isError, refetch } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();
  const [draft, setDraft] = useState<NotificationPreference[]>([]);
  const [dirty, setDirty] = useState(false);
  const [syncedData, setSyncedData] = useState<NotificationPreference[] | undefined>(undefined);

  // Reset draft when server preferences change (avoid setState-in-effect).
  if (data !== undefined && data !== syncedData) {
    setSyncedData(data);
    setDraft(clonePreferences(data));
    setDirty(false);
  }

  const { adminPrefs, otherPrefs } = useMemo(() => {
    const admin: NotificationPreference[] = [];
    const other: NotificationPreference[] = [];
    for (const pref of draft) {
      if (isAdminRelevantNotificationType(pref.type)) admin.push(pref);
      else other.push(pref);
    }
    admin.sort((a, b) => {
      const ai = ADMIN_NOTIFICATION_TYPES.indexOf(
        a.type as (typeof ADMIN_NOTIFICATION_TYPES)[number]
      );
      const bi = ADMIN_NOTIFICATION_TYPES.indexOf(
        b.type as (typeof ADMIN_NOTIFICATION_TYPES)[number]
      );
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    return { adminPrefs: admin, otherPrefs: other };
  }, [draft]);

  const patchPref = (type: string, key: 'pushEnabled' | 'emailEnabled', value: boolean) => {
    setDraft(prev => prev.map(p => (p.type === type ? { ...p, [key]: value } : p)));
    setDirty(true);
  };

  const handleSave = () => {
    updatePrefs.mutate(
      { preferences: draft },
      {
        onSuccess: env => {
          toast.success(env.message ?? 'Đã lưu cài đặt thông báo');
          setDirty(false);
        },
        onError: err => toast.error(getNotificationMutationError(err, 'Không thể lưu cài đặt')),
      }
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/admin/notifications"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Quay lại hộp thư
          </Link>
          <p className="text-sm text-muted-foreground">
            Bật/tắt push và email theo từng loại thông báo tài khoản Admin.
          </p>
        </div>
        <button
          type="button"
          disabled={!dirty || updatePrefs.isPending || draft.length === 0}
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {updatePrefs.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          Lưu thay đổi
        </button>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border py-20 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Đang tải cài đặt…
        </div>
      ) : isError ? (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
          <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden />
          <div className="space-y-3">
            <p className="font-semibold text-destructive">Không tải được cài đặt thông báo</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted"
            >
              <RefreshCw className="size-4" aria-hidden />
              Thử lại
            </button>
          </div>
        </div>
      ) : (
        <>
          <PreferenceSection
            title="Vận hành hệ thống"
            description="Cảnh báo báo cáo, SLA, trùng lặp và hợp đồng — ưu tiên cho Admin."
            prefs={adminPrefs}
            onPatch={patchPref}
          />
          {otherPrefs.length > 0 && (
            <PreferenceSection
              title="Khác"
              description="Các loại còn lại từ hệ thống — có thể tắt nếu không cần."
              prefs={otherPrefs}
              onPatch={patchPref}
              muted
            />
          )}
        </>
      )}
    </div>
  );
}

function PreferenceSection({
  title,
  description,
  prefs,
  onPatch,
  muted,
}: {
  title: string;
  description: string;
  prefs: NotificationPreference[];
  onPatch: (type: string, key: 'pushEnabled' | 'emailEnabled', value: boolean) => void;
  muted?: boolean;
}) {
  if (prefs.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className={cn('border-b border-border px-5 py-4', muted && 'bg-muted/20')}>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <ul className="divide-y divide-border">
        {prefs.map(pref => (
          <li
            key={pref.type}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{notificationTypeLabel(pref.type)}</p>
              <p className="text-xs text-muted-foreground">{pref.type}</p>
            </div>
            <div className="flex shrink-0 gap-4">
              <ToggleField
                id={`admin-${pref.type}-push`}
                label="Push"
                checked={pref.pushEnabled}
                onChange={v => onPatch(pref.type, 'pushEnabled', v)}
              />
              <ToggleField
                id={`admin-${pref.type}-email`}
                label="Email"
                checked={pref.emailEnabled}
                onChange={v => onPatch(pref.type, 'emailEnabled', v)}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ToggleField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition',
          checked ? 'bg-emerald-600' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition',
            checked && 'translate-x-5'
          )}
        />
      </button>
    </label>
  );
}
