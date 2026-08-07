import {
  adaptMediaPresign,
  adaptPresignAndUpload,
  adaptUploadCommentImage,
  adaptUploadReportImage,
  adaptUploadReportVideo,
  uploadFileToPresignedUrl,
} from '@/lib/api/adapters/media.adapter';
import type {
  CommentImageUploadResult,
  MediaPresignInput,
  MediaPresignResult,
  MediaPresignPurpose,
  ReportImageUploadResult,
  ReportVideoUploadResult,
} from '@/lib/api/models/media';

export type {
  CommentImageUploadResult,
  MediaPresignInput,
  MediaPresignPurpose,
  MediaPresignResult,
  ReportImageUploadResult,
  ReportVideoUploadResult,
};

/** POST /v1/media/presign */
export async function presignMedia(body: MediaPresignInput): Promise<MediaPresignResult> {
  return adaptMediaPresign(body);
}

/** Presign + PUT R2 */
export async function presignAndUploadMedia(
  input: MediaPresignInput,
  file: File
): Promise<MediaPresignResult> {
  return adaptPresignAndUpload(input, file);
}

export { uploadFileToPresignedUrl };

/** POST /v1/media/reports/images */
export async function uploadReportImage(file: File): Promise<ReportImageUploadResult> {
  return adaptUploadReportImage(file);
}

/** POST /v1/media/reports/videos */
export async function uploadReportVideo(file: File): Promise<ReportVideoUploadResult> {
  return adaptUploadReportVideo(file);
}

/** POST /v1/media/comments/images */
export async function uploadCommentImage(file: File): Promise<CommentImageUploadResult> {
  return adaptUploadCommentImage(file);
}

const mediaService = {
  presignMedia,
  presignAndUploadMedia,
  uploadFileToPresignedUrl,
  uploadReportImage,
  uploadReportVideo,
  uploadCommentImage,
};

export default mediaService;
