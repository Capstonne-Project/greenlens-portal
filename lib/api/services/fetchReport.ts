import { adaptRejectReport, adaptVerifyReport } from '@/lib/api/adapters/reportActions.adapter';
import type { RejectReportInput, VerifyReportInput } from '@/lib/api/models/reportAction';

export type { RejectReportInput, VerifyReportInput } from '@/lib/api/models/reportAction';

export async function verifyReport(id: string, body: VerifyReportInput = {}): Promise<void> {
  return adaptVerifyReport(id, body);
}

export async function rejectReport(id: string, body: RejectReportInput): Promise<void> {
  return adaptRejectReport(id, body);
}

export default {
  verifyReport,
  rejectReport,
};
