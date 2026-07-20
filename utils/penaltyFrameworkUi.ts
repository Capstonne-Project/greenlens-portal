export function formatPenaltyAmount(amount: number, currency = 'VND'): string {
  if (!Number.isFinite(amount)) return '0 ₫';

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPenaltyAmountRange(min: number, max: number, currency = 'VND'): string {
  const formattedMin = formatPenaltyAmount(min, currency).replace(/\s?₫$/, '');
  return `${formattedMin} – ${formatPenaltyAmount(max, currency)}`;
}

export function getPenaltyViolationBadgeClass(level: string): string {
  switch (level) {
    case 'Minor':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'Moderate':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'Major':
      return 'border-orange-200 bg-orange-50 text-orange-800';
    case 'Critical':
      return 'border-rose-200 bg-rose-50 text-rose-800';
    default:
      return 'border-border bg-muted text-muted-foreground';
  }
}

export function getPenaltyMutationError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { status?: number; data?: { message?: string } } }).response;
    if (res?.status === 409) {
      return 'Đã có khung phạt đang hiệu lực cho loại ô nhiễm và cấp vi phạm này.';
    }

    const msg = res?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }

  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}
