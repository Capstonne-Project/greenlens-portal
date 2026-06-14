import {
  adaptAssignOfficeOfficer,
  adaptCreateOffice,
  adaptFetchLeoMyReports,
  adaptOfficeDetail,
  adaptOfficesList,
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
  LeoMyReportsSortBy,
  Office,
  OfficeDetail,
  OfficeListItem,
  OfficesList,
  OfficesListParams,
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

export default {
  fetchOffices,
  fetchOfficeDetail,
  createOffice,
  updateOffice,
  assignOfficeOfficer,
  fetchLeoMyReports,
};
