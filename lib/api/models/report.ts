import type { ReportSeverity } from '@/lib/api/models/adminReport';
import type { ReportStatus } from '@/lib/constants/reportStatus';

export type { ReportSeverity } from '@/lib/api/models/adminReport';
export type { ReportStatus } from '@/lib/constants/reportStatus';

export type SeveritySetBy = 'User' | 'AI' | 'Officer';

/** GET /v1/reports/{id} — `data.media[]` */
export interface ReportMedia {
  id: string;
  mediaType: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

/** GET /v1/reports/{id} — `data.assignments[]` */
export interface ReportAssignment {
  id: string;
  teamId: string;
  teamName: string;
  teamType: string;
  status: string;
  note: string;
  assignedAt: string;
  startedAt: string;
  completedAt: string;
  progressPercent: number;
  progressNote: string;
  progressUpdatedAt: string;
}

/** GET /v1/reports/{id} — `data.wasteTags[]` */
export interface ReportWasteTag {
  tagId: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl: string;
}

/** GET /v1/reports/{id} — domain model (khớp Swagger BE; `status` đã normalize). */
export interface ReportDetail {
  id: string;
  code: string;
  reporterId: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  severity: ReportSeverity;
  severitySetBy: SeveritySetBy;
  status: ReportStatus;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  wardCode: string;
  provinceCode: string;
  priorityScore: number;
  reporterCount: number;
  reopenedCount: number;
  aiClassifiedType: string | null;
  aiConfidence: number | null;
  verifiedBy: string | null;
  assignedByOfficerId: string | null;
  assignedOfficeId: string | null;
  media: ReportMedia[];
  assignments: ReportAssignment[];
  wasteTags: ReportWasteTag[];
  aiSuggestedWasteTagCodes: string | null;
  createdAt: string;
  verifiedAt: string | null;
  startedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  slaVerifyDueAt: string | null;
  slaResolveDueAt: string | null;
}
