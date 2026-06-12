/**
 * L2 — Departments (ủy ban / Sở TNMT).
 */
import {
  adaptAssignDepartmentOfficer,
  adaptCreateDepartment,
  adaptDeactivateDepartment,
  adaptDepartmentDetail,
  adaptDepartmentsList,
  adaptUpdateDepartment,
} from '@/lib/api/adapters/departments.adapter';
import type {
  AssignDepartmentOfficerInput,
  CreateDepartmentInput,
  Department,
  DepartmentDetail,
  DepartmentsList,
  DepartmentsListParams,
  UpdateDepartmentInput,
} from '@/lib/api/models/department';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AssignDepartmentOfficerInput,
  CreateDepartmentInput,
  Department,
  DepartmentDeo,
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

export async function assignDepartmentOfficer(
  id: string,
  body: AssignDepartmentOfficerInput
): Promise<void> {
  return adaptAssignDepartmentOfficer(id, body);
}

const departmentApi = {
  fetchDepartments,
  fetchDepartmentDetail,
  createDepartment,
  updateDepartment,
  deactivateDepartment,
  assignDepartmentOfficer,
};

export default departmentApi;
