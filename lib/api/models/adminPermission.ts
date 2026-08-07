export interface AdminPermission {
  key: string;
  module: string;
  action: string;
  description: string;
}

export interface AdminPermissionsList {
  items: AdminPermission[];
}
