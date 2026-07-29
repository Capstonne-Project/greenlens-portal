/** Raw DTO — GET /v1/notifications (BR-NTF-001). */

export interface NotificationItemDto {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  categoryName: string | null;
  thumbnailUrl: string | null;
}

export interface NotificationsListDto {
  items: NotificationItemDto[];
  totalCount: number;
  unreadCount: number;
}
