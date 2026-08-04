'use client';

import {
  presignAndUploadMedia,
  presignMedia,
  uploadCommentImage,
  uploadReportImage,
  uploadReportVideo,
  type MediaPresignInput,
  type MediaPresignPurpose,
} from '@/lib/api/services/fetchMedia';
import { useMutation } from '@tanstack/react-query';

export const mediaKeys = {
  all: ['media'] as const,
};

/** POST /v1/media/presign */
export function useMediaPresign() {
  return useMutation({
    mutationFn: (body: MediaPresignInput) => presignMedia(body),
  });
}

/** Presign + PUT R2 */
export function usePresignAndUploadMedia() {
  return useMutation({
    mutationFn: ({ input, file }: { input: MediaPresignInput; file: File }) =>
      presignAndUploadMedia(input, file),
  });
}

/** POST /v1/media/reports/images */
export function useUploadReportImage() {
  return useMutation({
    mutationFn: (file: File) => uploadReportImage(file),
  });
}

/** POST /v1/media/reports/videos */
export function useUploadReportVideo() {
  return useMutation({
    mutationFn: (file: File) => uploadReportVideo(file),
  });
}

/** POST /v1/media/comments/images */
export function useUploadCommentImage() {
  return useMutation({
    mutationFn: (file: File) => uploadCommentImage(file),
  });
}

export type { MediaPresignPurpose };
