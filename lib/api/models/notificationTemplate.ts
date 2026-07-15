/** FE models — admin notification templates. */

export interface NotificationTemplateListItem {
  id: string;
  templateKey: string;
  titleVi: string;
  channel: string;
  type: string;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NotificationTemplateDetail {
  id: string;
  templateKey: string;
  titleVi: string;
  bodyVi: string;
  titleEn: string;
  bodyEn: string;
  channel: string;
  type: string;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface NotificationTemplatesPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NotificationTemplatesList {
  items: NotificationTemplateListItem[];
  pagination: NotificationTemplatesPagination;
}

export interface NotificationTemplatesListParams {
  page?: number;
  pageSize?: number;
  channel?: string;
  isPublished?: boolean;
}

export interface NotificationTemplateWriteInput {
  templateKey: string;
  titleVi: string;
  bodyVi: string;
  titleEn: string;
  bodyEn: string;
  channel: string;
  type: string;
}

export interface CreateNotificationTemplateResult {
  id: string;
  templateKey: string;
  isPublished: boolean;
}

export interface PublishNotificationTemplateInput {
  publish: boolean;
}
