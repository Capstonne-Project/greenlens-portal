import type {
  CitizenCommentDto,
  GetCitizenReportCommentsDataDto,
} from '@/lib/api/dto/citizenReportComment.dto';
import type { CitizenComment, CitizenReportComments } from '@/lib/api/models/citizenReportComment';
import type { PaginationMeta } from '@/lib/api/models/office';

function mapPagination(dto: PaginationMeta): PaginationMeta {
  return {
    page: dto.page,
    pageSize: dto.pageSize,
    totalItems: dto.totalItems,
    totalPages: dto.totalPages,
    hasNext: dto.hasNext,
    hasPrev: dto.hasPrev,
  };
}

export function mapCitizenCommentDto(dto: CitizenCommentDto): CitizenComment {
  return {
    id: dto.id,
    content: dto.content,
    authorName: dto.authorName,
    authorId: dto.authorId,
    authorAvatarUrl: dto.authorAvatarUrl ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt ?? null,
    isHidden: dto.isHidden,
    canEdit: dto.canEdit,
    canDelete: dto.canDelete,
    parentCommentId: dto.parentCommentId ?? null,
    likeCount: dto.likeCount,
    likedByMe: dto.likedByMe,
    images: dto.images.map(img => ({
      url: img.url,
      mimeType: img.mimeType,
      sizeBytes: img.sizeBytes,
    })),
  };
}

export function mapGetCitizenReportCommentsDataDto(
  data: GetCitizenReportCommentsDataDto
): CitizenReportComments {
  return {
    items: (data.items ?? []).map(mapCitizenCommentDto),
    pagination: mapPagination(data.pagination),
  };
}
