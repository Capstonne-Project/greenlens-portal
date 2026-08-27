/**
 * FE template — nội dung bài đăng chia sẻ chương trình dọn cộng đồng.
 * Header / section icons / lưu ý: hardcode.
 * Tiêu đề: 🌱 THÔNG TIN THAM GIA {title} CÙNG GREENLENS 🌱
 * Mô tả LEO (`description`) → Chuẩn bị cá nhân.
 * Thời gian API → Lịch trình hoạt động.
 * Điểm hẹn API → Địa điểm tập trung.
 */

export interface CommunityCleanupSharePostInput {
  title: string;
  description?: string | null;
  meetingNote?: string | null;
  reportAddress?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  hashtags?: string[];
}

const HARDCODED_ARRIVAL = [
  '👉 Khi đến nơi, bạn vui lòng:',
  '• Check-in theo hướng dẫn của Leader',
  '• Tuân thủ hướng dẫn an toàn tại khu vực',
].join('\n');

const HARDCODED_NOTES = [
  '⚠️ Lưu ý quan trọng',
  '• Thời gian hoạt động có thể thay đổi tùy theo khối lượng rác thực tế',
  '• Hãy tuân thủ hướng dẫn an toàn và phối hợp cùng đội nhóm để đạt hiệu quả cao nhất',
].join('\n');

function formatShareHeader(title: string): string {
  return `🌱 THÔNG TIN THAM GIA ${title.toUpperCase()} CÙNG GREENLENS 🌱`;
}

function formatDateTimeVi(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Chuẩn hoá mô tả thành các dòng bullet nếu LEO xuống dòng. */
function formatDescriptionBody(description: string): string {
  const lines = description
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return '';
  if (lines.length === 1) return lines[0]!;
  return lines.map(line => (line.startsWith('•') ? line : `• ${line}`)).join('\n');
}

function formatMeetingLocation(
  meetingNote: string | null | undefined,
  reportAddress: string | null | undefined
): string | null {
  const note = meetingNote?.trim() || '';
  const address = reportAddress?.trim() || '';
  if (!note && !address) return null;
  const lines = ['📍 Địa điểm tập trung'];
  if (note) lines.push(note);
  if (address && address !== note) lines.push(address);
  return lines.join('\n');
}

function formatSchedule(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined
): string | null {
  const start = formatDateTimeVi(startsAt);
  const end = formatDateTimeVi(endsAt);
  if (!start && !end) return null;
  const lines = ['⏰ Lịch trình hoạt động'];
  if (start) lines.push(`• Ngày bắt đầu: ${start}`);
  if (end) lines.push(`• Ngày kết thúc: ${end}`);
  return lines.join('\n');
}

function formatHashtags(hashtags: string[] | undefined): string | null {
  if (!hashtags?.length) return null;
  const tags = hashtags
    .map(tag => tag.trim())
    .filter(Boolean)
    .map(tag => (tag.startsWith('#') ? tag : `#${tag}`));
  if (tags.length === 0) return null;
  return tags.join(' ');
}

/** Ghép caption chia sẻ (copy / paste Facebook) theo mẫu UX nội dung tham gia. */
export function buildCommunityCleanupSharePost(input: CommunityCleanupSharePostInput): string {
  const title = input.title.trim() || 'Chương trình dọn cộng đồng';
  const description = input.description?.trim() || '';

  const blocks: string[] = [formatShareHeader(title)];

  if (description) {
    blocks.push(`🎒 Chuẩn bị cá nhân\n${formatDescriptionBody(description)}`);
  }

  const schedule = formatSchedule(input.startsAt, input.endsAt);
  if (schedule) blocks.push(schedule);

  const location = formatMeetingLocation(input.meetingNote, input.reportAddress);
  if (location) blocks.push(location);

  blocks.push(HARDCODED_ARRIVAL);
  blocks.push(HARDCODED_NOTES);

  const tags = formatHashtags(input.hashtags);
  if (tags) blocks.push(tags);

  return blocks.join('\n\n');
}

/** Mở popup sharer.php — fallback khi auto-post Facebook Page thất bại. */
export function openFacebookSharerFallback(facebookShareUrl: string): boolean {
  const trimmed = facebookShareUrl.trim();
  if (!trimmed || typeof window === 'undefined') return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    window.open(parsed.toString(), '_blank', 'noopener,noreferrer,width=600,height=640');
    return true;
  } catch {
    return false;
  }
}
