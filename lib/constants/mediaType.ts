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
