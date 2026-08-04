import type {
  AdminPermissionItemDto,
  AdminPermissionsListDataDto,
} from '@/lib/api/dto/adminPermission.dto';
import type { AdminPermission, AdminPermissionsList } from '@/lib/api/models/adminPermission';

function mapPermissionDto(dto: AdminPermissionItemDto): AdminPermission {
  const key = dto.key?.trim() ?? '';
  const moduleName = dto.module?.trim() ?? '';
  const action = dto.action?.trim() ?? '';
  return {
    key,
    module: moduleName,
    action,
    description: dto.description?.trim() ?? '',
  };
}

export function mapAdminPermissionsListDataDto(
  dto: AdminPermissionsListDataDto
): AdminPermissionsList {
  const raw = dto.items ?? [];
  const items = raw.map(mapPermissionDto).filter(p => p.key || p.module || p.action);
  return { items };
}
