export type MediaPresignPurpose =
  | 'ReportImage'
  | 'ReportVideo'
  | 'BeforeImage'
  | 'ProgressImage'
  | 'AfterImage'
  | 'CommentImage'
  | 'EvidenceImage';

export type MediaPresignInput = {
  fileName: string;
  contentType: string;
  mediaType: MediaPresignPurpose;
};

export type MediaPresignResult = {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string | null;
  expiresAt: string | null;
};

export type ReportImageUploadResult = {
  url: string;
  objectKey: string | null;
  message: string | null;
};

export type ReportVideoUploadResult = {
  url: string;
  objectKey: string | null;
  message: string | null;
};

export type CommentImageUploadResult = {
  url: string;
  objectKey: string | null;
  message: string | null;
};
