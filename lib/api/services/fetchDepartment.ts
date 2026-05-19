/**
 * L2 — Departments (ủy ban / Sở TNMT).
 */
import {
  adaptCreateDepartment,
  adaptDeactivateDepartment,
  adaptDepartmentDetail,
  adaptDepartmentsList,
  adaptUpdateDepartment,
} from '@/lib/api/adapters/departments.adapter';
import type {
  CreateDepartmentInput,
  Department,
  DepartmentDetail,
  DepartmentsList,
  DepartmentsListParams,
  UpdateDepartmentInput,
} from '@/lib/api/models/department';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  CreateDepartmentInput,
  Department,
  DepartmentDetail,
  DepartmentListItem,
  DepartmentOfficeSummary,
  DepartmentsList,
  DepartmentsListParams,
  UpdateDepartmentInput,
} from '@/lib/api/models/department';

export async function fetchDepartments(
  params?: DepartmentsListParams
): Promise<ApiEnvelope<DepartmentsList>> {
  return adaptDepartmentsList(params);
}

export async function fetchDepartmentDetail(id: string): Promise<ApiEnvelope<DepartmentDetail>> {
  return adaptDepartmentDetail(id);
}

export async function createDepartment(
  body: CreateDepartmentInput
): Promise<ApiEnvelope<Department>> {
  return adaptCreateDepartment(body);
}

export async function updateDepartment(id: string, body: UpdateDepartmentInput): Promise<void> {
  return adaptUpdateDepartment(id, body);
}

export async function deactivateDepartment(id: string): Promise<void> {
  return adaptDeactivateDepartment(id);
}

export default {
  fetchDepartments,
  fetchDepartmentDetail,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
};
