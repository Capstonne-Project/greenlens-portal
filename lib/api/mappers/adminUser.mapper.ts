import type {
  AdminRoleDto,
  AdminUserDetailDto,
  AdminUserDto,
  AdminUserMutationDataDto,
  AdminUsersPagedDto,
  CreateAdminUserDataDto,
} from '@/lib/api/dto/adminUser.dto';
import { normalizeApiRole } from '@/lib/constants/systemRoles';
import type {
  AdminRole,
  AdminUser,
  AdminUserDetail,
  AdminUserMutationResult,
  AdminUsersList,
  PaginationMeta,
} from '@/lib/api/models/adminUser';

export function mapAdminUserDto(dto: AdminUserDto): AdminUser {
  return {
    id: dto.id,
    email: dto.email ?? '',
    fullName: dto.fullName ?? '',
    phoneNumber: dto.phoneNumber ?? null,
    avatarUrl: dto.avatarUrl ?? null,
    role: normalizeApiRole(dto.role),
    isEmailVerified: Boolean(dto.isEmailVerified),
    createdAt: dto.createdAt ?? '',
  };
}

export function mapAdminUserDetailDto(dto: AdminUserDetailDto): AdminUserDetail {
  return {
    ...mapAdminUserDto(dto),
    googleId: dto.googleId ?? null,
    updatedAt: dto.updatedAt ?? null,
  };
}

export function mapAdminRoleDto(dto: AdminRoleDto): AdminRole {
  return {
    name: dto.name ?? '',
    description: dto.description ?? '',
  };
}

export function mapAdminRoleDtoList(dtos: AdminRoleDto[]): AdminRole[] {
  return dtos.map(mapAdminRoleDto);
}

export function mapPaginationDto(dto: AdminUsersPagedDto['pagination']): PaginationMeta {
  return {
    page: dto.page,
    pageSize: dto.pageSize,
    totalItems: dto.totalItems,
    totalPages: dto.totalPages,
    hasNext: dto.hasNext,
    hasPrev: dto.hasPrev,
  };
}

export function mapAdminUsersPagedDto(dto: AdminUsersPagedDto): AdminUsersList {
  return {
    items: dto.items.map(mapAdminUserDto),
    pagination: mapPaginationDto(dto.pagination),
  };
}

export function mapAdminUserDtoList(dtos: AdminUserDto[]): AdminUser[] {
  return dtos.map(mapAdminUserDto);
}

export function mapCreateAdminUserDataDto(dto: CreateAdminUserDataDto): AdminUserMutationResult & {
  email: string;
  fullName: string;
  role: string;
} {
  return {
    userId: dto.userId,
    message: dto.message,
    email: dto.email,
    fullName: dto.fullName,
    role: dto.role,
  };
}

export function mapAdminUserMutationDataDto(
  dto: AdminUserMutationDataDto
): AdminUserMutationResult {
  return {
    userId: dto.userId,
    message: dto.message,
  };
}
