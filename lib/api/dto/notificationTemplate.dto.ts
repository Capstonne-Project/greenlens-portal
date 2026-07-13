/** DTO khớp Swagger — /v1/admin/notification-templates */

export interface NotificationTemplateListItemDto {
  id: string;
  templateKey: string;
  titleVi: string;
  channel: string;
  type: string;
  isPublished: boolean;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface NotificationTemplatesListDataDto {
  items: NotificationTemplateListItemDto[];
  totalCount: number;
}

export interface NotificationTemplatesListParamsDto {
  page?: number;
  pageSize?: number;
  channel?: string;
  isPublished?: boolean;
}

export interface NotificationTemplateDetailDto {
  id: string;
  templateKey: string;
  titleVi: string;
  bodyVi: string;
  titleEn?: string | null;
  bodyEn?: string | null;
  channel: string;
  type: string;
  isPublished: boolean;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface NotificationTemplateWriteBodyDto {
  templateKey: string;
  titleVi: string;
  bodyVi: string;
  titleEn: string;
  bodyEn: string;
  channel: string;
  type: string;
}

export interface CreateNotificationTemplateDataDto {
  id: string;
  templateKey: string;
  isPublished: boolean;
}

export interface PublishNotificationTemplateBodyDto {
  publish: boolean;
}
