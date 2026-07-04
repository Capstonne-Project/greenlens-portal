import { HCMC_WARD_NAMES_BY_LENGTH } from '@/lib/constants/hcmcWardNames';

function normalizeForWardMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function formatPhuongLabel(name: string): string {
  return `P. ${name.trim()}`;
}

/** Khớp tên phường trong address khi không có tiền tố "Phường" / "P.". */
function matchWardNameInAddress(address: string): string | null {
  const normalizedAddress = normalizeForWardMatch(address);
  for (const ward of HCMC_WARD_NAMES_BY_LENGTH) {
    if (normalizedAddress.includes(normalizeForWardMatch(ward))) {
      return ward;
    }
  }
  return null;
}

/**
 * Cột vị trí: lấy phường từ `address`, hiển thị `P. {tên}`.
 * - Có "Phường" / "P." → lấy phần tên sau tiền tố
 * - Chỉ có tên (VD: "Bến Thành") → khớp danh sách phường HCM
 */
export function extractLocationLabel(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return '—';

  const inline = trimmed.match(/(?:Phường|P\.)\s*([^,;]+)/iu);
  if (inline?.[1]) {
    const name = inline[1].trim();
    if (name) return formatPhuongLabel(name);
  }

  const parts = trimmed
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
  for (const part of parts) {
    const seg = part.match(/^(?:Phường|P\.)\s*(.+)$/iu);
    if (seg?.[1]) {
      const name = seg[1].trim();
      if (name) return formatPhuongLabel(name);
    }
  }

  const matched = matchWardNameInAddress(trimmed);
  if (matched) return formatPhuongLabel(matched);

  return '—';
}

export function formatCheckInTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function formatTrackingSla(isoString: string): { text: string; overdue: boolean } {
  const due = new Date(isoString);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();

  if (diffMs < 0) {
    const overdueH = Math.floor(-diffMs / 3_600_000);
    return { text: `Quá hạn ${overdueH}h`, overdue: true };
  }

  const totalH = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);

  if (totalH > 0) {
    return {
      text: minutes > 0 ? `${totalH}h ${minutes}m` : `${totalH}h`,
      overdue: false,
    };
  }
  return { text: `${minutes}m`, overdue: false };
}

/** .NET DateTime.MinValue hoặc BE chưa gán ngày thực. */
export function isPlaceholderIsoDate(iso: string | null | undefined): boolean {
  if (!iso?.trim()) return true;
  if (iso.trim().startsWith('0001-')) return true;
  const year = new Date(iso).getFullYear();
  return Number.isNaN(year) || year < 1900;
}

/** Ngày tham gia nhân sự — hiển thị vi-VN hoặc "Chưa có" khi BE chưa set. */
export function formatJoinedDateVi(iso: string | null | undefined): string {
  if (isPlaceholderIsoDate(iso)) return 'Chưa có';
  return new Date(iso!).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
