/** Session-scoped hidden report IDs — BE có thể không trả `isHidden` sau hide. */

const STORAGE_KEY = 'gl_admin_hidden_report_ids';

function readIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}

export function getAdminHiddenReportIds(): Set<string> {
  return new Set(readIds());
}

export function isAdminReportMarkedHidden(id: string): boolean {
  return getAdminHiddenReportIds().has(id);
}

export function markAdminReportHidden(id: string) {
  const next = readIds();
  if (!next.includes(id)) next.push(id);
  writeIds(next);
}

export function markAdminReportVisible(id: string) {
  writeIds(readIds().filter(x => x !== id));
}
