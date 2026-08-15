/**
 * Media type trên report media item — khớp BE `public enum MediaType`.
 * Không nhầm với MediaPresignPurpose (mục đích upload presign).
 */
export const MEDIA_TYPES = [
  'Image',
  'Video',
  'Before',
  'Progress',
  'After',
  /** Ảnh hiện trường do Inspection Team chụp (BR-INS-010). */
  'Inspection',
  /** Evidence citizen upload khi yêu cầu mở lại (BR-REP-015). */
  'ReopenEvidence',
] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export function isMediaType(value: string): value is MediaType {
  return (MEDIA_TYPES as readonly string[]).includes(value);
}

/** Nhãn VI cho badge trên ảnh (gallery reopen / progress). */
export const MEDIA_TYPE_LABEL_VI: Record<MediaType, string> = {
  Image: 'Ảnh từ người dân',
  Video: 'Video',
  Before: 'Ảnh trước xử lý',
  Progress: 'Ảnh đang xử lý',
  After: 'Ảnh sau xử lý',
  Inspection: 'Thanh tra',
  ReopenEvidence: 'Minh chứng mở lại',
};

export function mediaTypeLabelVi(type: string): string {
  return isMediaType(type) ? MEDIA_TYPE_LABEL_VI[type] : type;
}
