import type {
  CreateNotificationTemplateDataDto,
  NotificationTemplateDetailDto,
  NotificationTemplateListItemDto,
  NotificationTemplatesListDataDto,
} from '@/lib/api/dto/notificationTemplate.dto';
import type {
  CreateNotificationTemplateResult,
  NotificationTemplateDetail,
  NotificationTemplateListItem,
  NotificationTemplatesList,
  NotificationTemplatesPagination,
} from '@/lib/api/models/notificationTemplate';

export function mapNotificationTemplateListItemDto(
  dto: NotificationTemplateListItemDto
): NotificationTemplateListItem {
  return {
    id: dto.id,
    templateKey: dto.templateKey?.trim() || '',
    titleVi: dto.titleVi?.trim() || '',
    channel: dto.channel?.trim() || '',
    type: dto.type?.trim() || '',
    isPublished: Boolean(dto.isPublished),
    isActive: Boolean(dto.isActive),
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
  };
}

function mapPagination(
  dto: NotificationTemplatesListDataDto,
  page: number,
  pageSize: number
): NotificationTemplatesPagination {
  const totalItems = Math.max(0, dto.totalCount ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.max(1, page);

  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

export function mapNotificationTemplatesListDataDto(
  dto: NotificationTemplatesListDataDto,
  page: number,
  pageSize: number
): NotificationTemplatesList {
  return {
    items: (dto.items ?? []).map(mapNotificationTemplateListItemDto),
    pagination: mapPagination(dto, page, pageSize),
  };
}

export function mapNotificationTemplateDetailDto(
  dto: NotificationTemplateDetailDto
): NotificationTemplateDetail {
  return {
    id: dto.id,
    templateKey: dto.templateKey?.trim() || '',
    titleVi: dto.titleVi?.trim() || '',
    bodyVi: dto.bodyVi?.trim() || '',
    titleEn: dto.titleEn?.trim() || '',
    bodyEn: dto.bodyEn?.trim() || '',
    channel: dto.channel?.trim() || '',
    type: dto.type?.trim() || '',
    isPublished: Boolean(dto.isPublished),
    isActive: Boolean(dto.isActive),
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? null,
  };
}

export function mapCreateNotificationTemplateDataDto(
  dto: CreateNotificationTemplateDataDto
): CreateNotificationTemplateResult {
  return {
    id: dto.id,
    templateKey: dto.templateKey?.trim() || '',
    isPublished: Boolean(dto.isPublished),
  };
}
