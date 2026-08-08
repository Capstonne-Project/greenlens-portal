export type TextCountMode = 'chars' | 'words';

export function countChars(value: string): number {
  return value.length;
}

/** Đếm từ theo khoảng trắng — bỏ qua chuỗi rỗng. */
export function countWords(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function getTextCount(value: string, mode: TextCountMode = 'chars'): number {
  return mode === 'words' ? countWords(value) : countChars(value);
}

export type TextLimitStatus = 'ok' | 'too-short' | 'too-long';

export function getTextLimitStatus(
  value: string,
  opts: { min?: number; max?: number; mode?: TextCountMode }
): TextLimitStatus {
  const mode = opts.mode ?? 'chars';
  const count = getTextCount(value, mode);
  const min = opts.min ?? 0;

  if (min > 0 && count < min) return 'too-short';
  if (opts.max != null && count > opts.max) return 'too-long';
  return 'ok';
}

export function textLimitUnit(mode: TextCountMode): string {
  return mode === 'words' ? 'từ' : 'ký tự';
}

export function formatTextLimitCounter(
  value: string,
  opts: { min?: number; max: number; mode?: TextCountMode; showWords?: boolean }
): string {
  const mode = opts.mode ?? 'chars';
  const count = getTextCount(value, mode);
  const unit = textLimitUnit(mode);
  const base = `${count}/${opts.max} ${unit}`;

  if (opts.showWords && mode === 'chars') {
    const words = countWords(value);
    return `${base} · ${words} từ`;
  }

  return base;
}

export function textLimitHint(
  value: string,
  opts: { min?: number; max?: number; mode?: TextCountMode }
): string | null {
  const status = getTextLimitStatus(value, opts);
  const mode = opts.mode ?? 'chars';
  const unit = textLimitUnit(mode);
  const count = getTextCount(value, mode);
  const min = opts.min ?? 0;

  if (status === 'too-short' && min > 0) {
    return `Cần ít nhất ${min} ${unit} (hiện ${count})`;
  }
  if (status === 'too-long' && opts.max != null) {
    return `Tối đa ${opts.max} ${unit} (hiện ${count})`;
  }
  return null;
}

export function isTextWithinLimits(
  value: string,
  opts: { min?: number; max?: number; mode?: TextCountMode }
): boolean {
  return getTextLimitStatus(value, opts) === 'ok';
}
