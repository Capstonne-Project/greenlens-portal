import type {
  CommentImageUploadDataDto,
  MediaPresignBodyDto,
  MediaPresignDataDto,
  ReportImageUploadDataDto,
  ReportVideoUploadDataDto,
} from '@/lib/api/dto/media.dto';
import type {
  CommentImageUploadResult,
  MediaPresignInput,
  MediaPresignResult,
  ReportImageUploadResult,
  ReportVideoUploadResult,
} from '@/lib/api/models/media';
import apiService from '@/lib/api/core';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

function mapPresign(dto: MediaPresignDataDto): MediaPresignResult {
  return {
    uploadUrl: dto.uploadUrl,
    objectKey: dto.objectKey,
    publicUrl: dto.publicUrl ?? null,
    expiresAt: dto.expiresAt ?? null,
  };
}

function mapReportImage(dto: ReportImageUploadDataDto): ReportImageUploadResult {
  return {
    url: dto.url,
    objectKey: dto.objectKey ?? null,
    message: dto.message ?? null,
  };
}

function mapReportVideo(dto: ReportVideoUploadDataDto): ReportVideoUploadResult {
  return {
    url: dto.url,
    objectKey: dto.objectKey ?? null,
    message: dto.message ?? null,
  };
}

function mapCommentImage(dto: CommentImageUploadDataDto): CommentImageUploadResult {
  return {
    url: dto.url,
    objectKey: dto.objectKey ?? null,
    message: dto.message ?? null,
  };
}

/** POST /v1/media/presign — presigned URL upload R2. */
export async function adaptMediaPresign(body: MediaPresignInput): Promise<MediaPresignResult> {
  const payload: MediaPresignBodyDto = {
    fileName: body.fileName.trim(),
    contentType: body.contentType.trim(),
    mediaType: body.mediaType,
  };

  const res = await apiService.post<ApiEnvelope<MediaPresignDataDto>>('/v1/media/presign', payload);

  return mapPresign(res.data.data);
}

/** PUT file lên R2 qua presigned URL (không qua apiService). */
export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  contentType: string
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Upload storage thất bại (${res.status})`);
  }
}

/** POST /v1/media/reports/images — upload ảnh báo cáo qua BE. */
export async function adaptUploadReportImage(file: File): Promise<ReportImageUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiService.upload<ApiEnvelope<ReportImageUploadDataDto>>(
    '/v1/media/reports/images',
    formData
  );

  return mapReportImage(res.data.data);
}

/** POST /v1/media/reports/videos */
export async function adaptUploadReportVideo(file: File): Promise<ReportVideoUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiService.upload<ApiEnvelope<ReportVideoUploadDataDto>>(
    '/v1/media/reports/videos',
    formData
  );

  return mapReportVideo(res.data.data);
}

/** POST /v1/media/comments/images */
export async function adaptUploadCommentImage(file: File): Promise<CommentImageUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiService.upload<ApiEnvelope<CommentImageUploadDataDto>>(
    '/v1/media/comments/images',
    formData
  );

  return mapCommentImage(res.data.data);
}

/** Presign → PUT R2 — luồng upload chuẩn Mobile/Web. */
export async function adaptPresignAndUpload(
  input: MediaPresignInput,
  file: File
): Promise<MediaPresignResult> {
  const presign = await adaptMediaPresign(input);
  await uploadFileToPresignedUrl(presign.uploadUrl, file, input.contentType);
  return presign;
}
