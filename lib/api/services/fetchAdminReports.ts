/**
 * L2 — Admin reports (thin). Adapter + FE models; UI import models only.
 */
import {
  adaptAdminReportDetail,
  adaptAdminReportsList,
} from '@/lib/api/adapters/adminReports.adapter';
import type {
  AdminReportDetail,
  AdminReportsList,
  AdminReportsListParams,
} from '@/lib/api/models/adminReport';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AdminReportDetail,
  AdminReportListItem,
  AdminReportsList,
  AdminReportsListParams,
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

export default {
  fetchAdminReports,
  fetchAdminReportDetail,
};
