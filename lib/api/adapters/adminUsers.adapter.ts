import type {
  AdminRoleDto,
  AdminUserDetailDto,
  AdminUserDto,
  AdminUserMutationDataDto,
  AdminUsersListParamsDto,
  AdminUsersPagedDto,
  ChangeUserRoleBodyDto,
  CreateAdminUserBodyDto,
  CreateAdminUserDataDto,
  UpdateAdminUserBodyDto,
} from '@/lib/api/dto/adminUser.dto';
import {
  mapAdminRoleDtoList,
  mapAdminUserDetailDto,
  mapAdminUserDtoList,
  mapAdminUsersPagedDto,
  mapAdminUserMutationDataDto,
  mapCreateAdminUserDataDto,
} from '@/lib/api/mappers/adminUser.mapper';
import type {
  AdminRole,
  AdminUser,
  AdminUserDetail,
  AdminUsersList,
  AdminUsersListParams,
  AdminUserMutationResult,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from '@/lib/api/models/adminUser';
import { mapApiEnvelope, type ApiEnvelope } from '@/lib/api/types/envelope';
import { getAdminUsersListStrategy } from '@/lib/config/adminUsers';
import apiService from '@/lib/api/core';

let adminAllUsersCache: Promise<ApiEnvelope<AdminUserDto[]>> | null = null;

export function clearAdminAllUsersCache(): void {
  adminAllUsersCache = null;
}

function buildQuery(params?: AdminUsersListParamsDto): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.page != null) query.page = params.page;
  if (params?.pageSize != null) query.pageSize = params.pageSize;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.role?.trim()) query.role = params.role.trim();
  if (params?.isEmailVerified !== undefined) query.isEmailVerified = params.isEmailVerified;
  return query;
}

function isAdminUserDtoArray(data: unknown): data is AdminUserDto[] {
  return (
    Array.isArray(data) &&
    (data.length === 0 ||
      (typeof data[0] === 'object' &&
        data[0] !== null &&
        'id' in data[0] &&
        typeof (data[0] as AdminUserDto).id === 'string'))
  );
}

function isAdminUsersPagedDto(data: unknown): data is AdminUsersPagedDto {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as AdminUsersPagedDto;
  return (
    Array.isArray(d.items) &&
    typeof d.pagination === 'object' &&
    d.pagination !== null &&
    typeof d.pagination.totalItems === 'number'
  );
}

function filterDtos(items: AdminUserDto[], params?: AdminUsersListParamsDto): AdminUserDto[] {
  let result = items;
  const role = params?.role?.trim();
  if (role) result = result.filter(u => u.role === role);
  if (params?.isEmailVerified !== undefined) {
    result = result.filter(u => u.isEmailVerified === params.isEmailVerified);
  }
  const search = params?.search?.trim().toLowerCase();
  if (search) {
    result = result.filter(u => {
      const haystack = [u.fullName, u.email, u.phoneNumber].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(search);
    });
  }
  return result;
}

function pageDtos(items: AdminUserDto[], params?: AdminUsersListParamsDto): AdminUsersPagedDto {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, params?.pageSize ?? 10);
  const filtered = filterDtos(items, params);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    pagination: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}

function normalizePagedEnvelope(
  envelope: ApiEnvelope<AdminUsersPagedDto | AdminUserDto[]>,
  params?: AdminUsersListParamsDto
): ApiEnvelope<AdminUsersPagedDto> {
  const { data } = envelope;
  if (isAdminUsersPagedDto(data)) return envelope as ApiEnvelope<AdminUsersPagedDto>;
  if (isAdminUserDtoArray(data)) {
    return { ...envelope, data: pageDtos(data, params) };
  }
  throw new Error('Unexpected admin users list shape from API');
}

async function fetchAllUsersRaw(): Promise<ApiEnvelope<AdminUserDto[]>> {
  if (!adminAllUsersCache) {
    adminAllUsersCache = apiService
      .get<ApiEnvelope<AdminUserDto[]>>('/v1/admin/users/all')
      .then(res => res.data)
      .catch(err => {
        adminAllUsersCache = null;
        throw err;
      });
  }
  return adminAllUsersCache;
}

/** Adapter: HTTP + normalize shape → map sang FE model. */
export async function adaptAdminUsersList(
  params?: AdminUsersListParams
): Promise<ApiEnvelope<AdminUsersList>> {
  const strategy = getAdminUsersListStrategy();
  const dtoParams = params as AdminUsersListParamsDto | undefined;

  if (strategy === 'all') {
    const raw = await fetchAllUsersRaw();
    const paged = { ...raw, data: pageDtos(raw.data, dtoParams) };
    return mapApiEnvelope(paged, mapAdminUsersPagedDto);
  }

  const query = buildQuery(dtoParams);

  if (strategy !== 'paged') {
    try {
      const res = await apiService.get<ApiEnvelope<AdminUsersPagedDto | AdminUserDto[]>>(
        '/v1/admin/users',
        query
      );
      const normalized = normalizePagedEnvelope(res.data, dtoParams);
      return mapApiEnvelope(normalized, mapAdminUsersPagedDto);
    } catch {
      const raw = await fetchAllUsersRaw();
      const paged = { ...raw, data: pageDtos(raw.data, dtoParams) };
      return mapApiEnvelope(paged, mapAdminUsersPagedDto);
    }
  }

  const res = await apiService.get<ApiEnvelope<AdminUsersPagedDto | AdminUserDto[]>>(
    '/v1/admin/users',
    query
  );
  const normalized = normalizePagedEnvelope(res.data, dtoParams);
  return mapApiEnvelope(normalized, mapAdminUsersPagedDto);
}

export async function adaptAdminAllUsers(): Promise<ApiEnvelope<AdminUser[]>> {
  const raw = await fetchAllUsersRaw();
  return mapApiEnvelope(raw, mapAdminUserDtoList);
}

export async function adaptCreateAdminUser(
  body: CreateAdminUserInput
): Promise<
  ApiEnvelope<AdminUserMutationResult & { email: string; fullName: string; role: string }>
> {
  const res = await apiService.post<ApiEnvelope<CreateAdminUserDataDto>>(
    '/v1/admin/users',
    body as CreateAdminUserBodyDto
  );
  return mapApiEnvelope(res.data, mapCreateAdminUserDataDto);
}

export async function adaptUpdateAdminUser(
  id: string,
  body: UpdateAdminUserInput
): Promise<ApiEnvelope<AdminUserMutationResult>> {
  const res = await apiService.put<ApiEnvelope<AdminUserMutationDataDto>>(
    `/v1/admin/users/${id}`,
    body as UpdateAdminUserBodyDto
  );
  return mapApiEnvelope(res.data, mapAdminUserMutationDataDto);
}

export async function adaptDeleteAdminUser(
  id: string
): Promise<ApiEnvelope<AdminUserMutationResult>> {
  const res = await apiService.delete<ApiEnvelope<AdminUserMutationDataDto>>(
    `/v1/admin/users/${id}`
  );
  return mapApiEnvelope(res.data, mapAdminUserMutationDataDto);
}

/** GET /v1/admin/users/{id} */
export async function adaptAdminUserDetail(id: string): Promise<ApiEnvelope<AdminUserDetail>> {
  const res = await apiService.get<ApiEnvelope<AdminUserDetailDto>>(
    `/v1/admin/users/${encodeURIComponent(id)}`
  );
  return mapApiEnvelope(res.data, mapAdminUserDetailDto);
}

/** GET /v1/admin/roles */
export async function adaptAdminRoles(): Promise<ApiEnvelope<AdminRole[]>> {
  const res = await apiService.get<ApiEnvelope<AdminRoleDto[]>>('/v1/admin/roles');
  return mapApiEnvelope(res.data, mapAdminRoleDtoList);
}

/** PUT /v1/admin/users/{id}/role — BE trả 200 `{ code, message, status }` (data có thể omit). */
export async function adaptChangeAdminUserRole(
  id: string,
  newRole: string
): Promise<ApiEnvelope<null>> {
  const payload: ChangeUserRoleBodyDto = { newRole };
  const res = await apiService.put<ApiEnvelope<unknown>>(
    `/v1/admin/users/${encodeURIComponent(id)}/role`,
    payload
  );
  return {
    code: res.data.code,
    message: res.data.message,
    status: res.data.status,
    data: null,
  };
}
