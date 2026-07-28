import type { NotificationItemDto, NotificationsListDto } from '@/lib/api/dto/notification.dto';
import type { NotificationItem, NotificationsList } from '@/lib/api/models/notification';

function asNullableString(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function mapNotificationItemDto(dto: NotificationItemDto): NotificationItem {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title ?? '',
    message: dto.message ?? '',
    referenceId: asNullableString(dto.referenceId),
    isRead: Boolean(dto.isRead),
    readAt: asNullableString(dto.readAt),
    createdAt: dto.createdAt ?? '',
    categoryName: asNullableString(dto.categoryName),
    thumbnailUrl: asNullableString(dto.thumbnailUrl),
  };
}

export function mapNotificationsListDto(dto: NotificationsListDto): NotificationsList {
  return {
    items: (dto.items ?? []).map(mapNotificationItemDto),
    totalCount: dto.totalCount ?? 0,
    unreadCount: dto.unreadCount ?? 0,
  };
}
