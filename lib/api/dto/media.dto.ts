/** POST /v1/media/presign */
export type MediaPresignPurposeDto =
  | 'ReportImage'
  | 'ReportVideo'
  | 'BeforeImage'
  | 'ProgressImage'
  | 'AfterImage'
  | 'CommentImage'
  | 'EvidenceImage';

export interface MediaPresignBodyDto {
  fileName: string;
  contentType: string;
  mediaType: MediaPresignPurposeDto;
}

export interface MediaPresignDataDto {
  uploadUrl: string;
  objectKey: string;
  publicUrl?: string | null;
  expiresAt?: string | null;
}

/** POST /v1/media/reports/images — multipart response */
export interface ReportImageUploadDataDto {
  url: string;
  objectKey?: string | null;
  message?: string | null;
}

/** POST /v1/media/reports/videos */
export interface ReportVideoUploadDataDto {
  url: string;
  objectKey?: string | null;
  message?: string | null;
}

/** POST /v1/media/comments/images */
export interface CommentImageUploadDataDto {
  url: string;
  objectKey?: string | null;
  message?: string | null;
}
