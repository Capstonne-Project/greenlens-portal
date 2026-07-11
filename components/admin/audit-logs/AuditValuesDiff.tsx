import type { AuditJsonObject, AuditJsonValue } from '@/lib/api/models/auditLog';
import { cn } from '@/lib/utils';

interface AuditValuesDiffProps {
  oldValues: AuditJsonValue | null;
  newValues: AuditJsonValue | null;
}

function isPlainObject(value: AuditJsonValue | null): value is AuditJsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringifyValue(value: AuditJsonValue | null): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function hasValueChanged(
  oldValue: AuditJsonValue | undefined,
  newValue: AuditJsonValue | undefined
) {
  return JSON.stringify(oldValue) !== JSON.stringify(newValue);
}

function PreCard({ label, value }: { label: string; value: AuditJsonValue | null }) {
  return (
    <div className="min-w-0 rounded-xl border border-border/70 bg-slate-50">
      <div className="border-b border-border/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-relaxed text-slate-800">
        {stringifyValue(value)}
      </pre>
    </div>
  );
}

export function AuditValuesDiff({ oldValues, newValues }: AuditValuesDiffProps) {
  if (oldValues === null && newValues === null) {
    return (
      <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-8 text-center text-sm text-emerald-900/70">
        Không có thay đổi dữ liệu
      </div>
    );
  }

  if (oldValues === null || newValues === null) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {oldValues !== null ? <PreCard label="Giá trị cũ" value={oldValues} /> : null}
        {newValues !== null ? <PreCard label="Giá trị mới" value={newValues} /> : null}
      </div>
    );
  }

  if (isPlainObject(oldValues) && isPlainObject(newValues)) {
    const keys = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)])).sort();

    if (keys.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-8 text-center text-sm text-emerald-900/70">
          Không có thay đổi dữ liệu
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-xl border border-border/70 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-emerald-50/50 text-xs uppercase tracking-wide text-emerald-900/70">
                <th className="w-48 px-4 py-3 font-semibold">Trường</th>
                <th className="px-4 py-3 font-semibold">Cũ</th>
                <th className="px-4 py-3 font-semibold">Mới</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {keys.map(key => {
                const oldValue = oldValues[key];
                const newValue = newValues[key];
                const changed = hasValueChanged(oldValue, newValue);

                return (
                  <tr key={key} className={cn(changed ? 'bg-amber-50/60' : 'bg-white')}>
                    <td className="px-4 py-3 align-top font-mono text-xs font-semibold text-emerald-950">
                      {key}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <pre className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
                        {oldValue === undefined ? '—' : stringifyValue(oldValue)}
                      </pre>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <pre className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
                        {newValue === undefined ? '—' : stringifyValue(newValue)}
                      </pre>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <PreCard label="Giá trị cũ" value={oldValues} />
      <PreCard label="Giá trị mới" value={newValues} />
    </div>
  );
}
