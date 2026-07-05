import {
  adaptAssignOfficeOfficer,
  adaptCreateOffice,
  adaptFetchLeoMyReports,
  adaptFetchOfficeStaff,
  adaptOfficeDetail,
  adaptOfficesList,
  adaptRecruitOfficeStaff,
  adaptUpdateOffice,
} from '@/lib/api/adapters/offices.adapter';
import type {
  AssignOfficeOfficerInput,
  CreateOfficeInput,
  LeoMyReportsData,
  LeoMyReportsParams,
  Office,
  OfficeDetail,
  OfficesList,
  OfficesListParams,
  OfficeStaffList,
  OfficeStaffListParams,
  RecruitOfficeStaffInput,
  RecruitOfficeStaffResult,
  UpdateOfficeInput,
} from '@/lib/api/models/office';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AssignOfficeOfficerInput,
  CreateOfficeInput,
  LeoMyReportAssignment,
  LeoMyReportItem,
  LeoMyReportsData,
  LeoMyReportsParams,
  LeoMyReportsSeverity,
  LeoMyReportsSortBy,
  LeoMyReportsStatus,
  Office,
  OfficeDetail,
  OfficeListItem,
  OfficesList,
  OfficesListParams,
  OfficeStaffList,
  OfficeStaffListParams,
  RecruitOfficeStaffInput,
  RecruitOfficeStaffResult,
  UpdateOfficeInput,
} from '@/lib/api/models/office';

export async function fetchOffices(params?: OfficesListParams): Promise<ApiEnvelope<OfficesList>> {
  return adaptOfficesList(params);
}

export async function fetchOfficeDetail(id: string): Promise<ApiEnvelope<OfficeDetail>> {
  return adaptOfficeDetail(id);
}

export async function createOffice(body: CreateOfficeInput): Promise<ApiEnvelope<Office>> {
  return adaptCreateOffice(body);
}

export async function updateOffice(id: string, body: UpdateOfficeInput): Promise<void> {
  return adaptUpdateOffice(id, body);
}

export async function assignOfficeOfficer(
  officeId: string,
  body: AssignOfficeOfficerInput
): Promise<void> {
  return adaptAssignOfficeOfficer(officeId, body);
}

/** GET /v1/offices/my/reports — LEO theo dõi báo cáo trong LocalOffice. */
export async function fetchLeoMyReports(
  params?: LeoMyReportsParams
): Promise<ApiEnvelope<LeoMyReportsData>> {
  return adaptFetchLeoMyReports(params);
}

/** GET /v1/offices/my/staff — danh sách Cleaner/Inspector trong LocalOffice. */
export async function fetchOfficeStaff(
  params?: OfficeStaffListParams
): Promise<ApiEnvelope<OfficeStaffList>> {
  return adaptFetchOfficeStaff(params);
}

/** POST /v1/offices/my/staff — LEO tuyển Citizen vào LocalOffice + đội. */
export async function recruitOfficeStaff(
  body: RecruitOfficeStaffInput
): Promise<ApiEnvelope<RecruitOfficeStaffResult>> {
  return adaptRecruitOfficeStaff(body);
}

export default {
  fetchOffices,
  fetchOfficeDetail,
  createOffice,
  updateOffice,
  assignOfficeOfficer,
  fetchLeoMyReports,
  fetchOfficeStaff,
  recruitOfficeStaff,
};
