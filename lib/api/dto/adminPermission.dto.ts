export interface AdminPermissionItemDto {
  key?: string;
  module?: string;
  action?: string;
  description?: string;
}

export interface AdminPermissionsListDataDto {
  items?: AdminPermissionItemDto[];
}
