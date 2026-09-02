import type { PaginationMeta } from '@/lib/api/models/office';

export interface CitizenCommentImageDto {
  url: string;
  mimeType: string;
  sizeBytes: number;
}

/** GET /v1/reports/{reportId}/comments — item, xem public (không cần đăng nhập). */
export interface CitizenCommentDto {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  authorAvatarUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  isHidden: boolean;
  canEdit: boolean;
  canDelete: boolean;
  parentCommentId?: string | null;
  likeCount: number;
  likedByMe: boolean;
  images: CitizenCommentImageDto[];
}

export interface GetCitizenReportCommentsDataDto {
  items: CitizenCommentDto[];
  pagination: PaginationMeta;
}
