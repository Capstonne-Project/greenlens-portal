import type {
  AdminPermissionItemDto,
  AdminPermissionsListDataDto,
} from '@/lib/api/dto/adminPermission.dto';
import { mapAdminPermissionsListDataDto } from '@/lib/api/mappers/adminPermission.mapper';
import type { AdminPermissionsList } from '@/lib/api/models/adminPermission';
import apiService from '@/lib/api/core';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';

/** GET /v1/admin/permissions */
export async function adaptAdminPermissionsList(): Promise<ApiEnvelope<AdminPermissionsList>> {
  const res =
    await apiService.get<ApiEnvelope<AdminPermissionsListDataDto | AdminPermissionItemDto[]>>(
      '/v1/admin/permissions'
    );

  const payload = res.data.data;
  const normalized: AdminPermissionsListDataDto = Array.isArray(payload)
    ? { items: payload }
    : (payload ?? {});

  return mapApiEnvelope({ ...res.data, data: normalized }, mapAdminPermissionsListDataDto);
}
