import type { PaginationMeta } from '@/lib/api/models/office';

export interface CitizenCommentImage {
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export interface CitizenComment {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  authorAvatarUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  isHidden: boolean;
  canEdit: boolean;
  canDelete: boolean;
  parentCommentId: string | null;
  likeCount: number;
  likedByMe: boolean;
  images: CitizenCommentImage[];
}

export interface CitizenReportComments {
  items: CitizenComment[];
  pagination: PaginationMeta;
}
