import {
  adaptCitizenReportComments,
  type FetchCitizenReportCommentsParams,
} from '@/lib/api/adapters/citizenReportComment.adapter';
import type { CitizenReportComments } from '@/lib/api/models/citizenReportComment';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type { CitizenComment, CitizenReportComments } from '@/lib/api/models/citizenReportComment';

/** Bình luận công khai của 1 report — xem được dù chưa đăng nhập. */
export async function fetchCitizenReportComments(
  params: FetchCitizenReportCommentsParams
): Promise<ApiEnvelope<CitizenReportComments>> {
  return adaptCitizenReportComments(params);
}

export default { fetchCitizenReportComments };
