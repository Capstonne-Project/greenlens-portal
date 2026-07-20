/**
 * L2 — Admin reports (thin). Adapter + FE models; UI import models only.
 */
import {
  adaptAdminReportDetail,
  adaptAdminReportsList,
  adaptHideAdminReport,
  adaptUnhideAdminReport,
  adaptUpdateAdminReportStatus,
} from '@/lib/api/adapters/adminReports.adapter';
import type {
  AdminReportDetail,
  AdminReportsList,
  AdminReportsListParams,
  HideAdminReportInput,
  UpdateAdminReportStatusInput,
} from '@/lib/api/models/adminReport';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AdminReportDetail,
  AdminReportListItem,
  AdminReportsList,
  AdminReportsListParams,
  HideAdminReportInput,
  UpdateAdminReportStatusInput,
  ReportSeverity,
  ReportStatus,
} from '@/lib/api/models/adminReport';

export async function fetchAdminReports(
  params?: AdminReportsListParams
): Promise<ApiEnvelope<AdminReportsList>> {
  return adaptAdminReportsList(params);
}

export async function fetchAdminReportDetail(id: string): Promise<ApiEnvelope<AdminReportDetail>> {
  return adaptAdminReportDetail(id);
}

export async function hideAdminReport(
  id: string,
  body: HideAdminReportInput
): Promise<ApiEnvelope<null>> {
  return adaptHideAdminReport(id, body);
}

export async function unhideAdminReport(id: string): Promise<ApiEnvelope<null>> {
  return adaptUnhideAdminReport(id);
}

export async function updateAdminReportStatus(
  id: string,
  body: UpdateAdminReportStatusInput
): Promise<ApiEnvelope<null>> {
  return adaptUpdateAdminReportStatus(id, body);
}

export default {
  fetchAdminReports,
  fetchAdminReportDetail,
  hideAdminReport,
  unhideAdminReport,
  updateAdminReportStatus,
};
