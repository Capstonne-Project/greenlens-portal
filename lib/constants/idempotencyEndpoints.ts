/**
 * Registry Idempotency-Key — BE GreenLens API v1 (2026-08-01).
 *
 * AI / dev: khi thêm mutation POST/PUT idempotent →
 * 1. Thêm entry vào bảng này với `webImplemented: true` sau khi wire L2.
 * 2. Sinh key ở L6 (`createIdempotencyKey`), truyền qua L4 → L2.
 * 3. Dùng `withOptionalIdempotency` / `executeIdempotentRequest` trong adapter.
 *
 * @see lib/api/idempotency.ts
 * @see .cursor/rules/su26-idempotency.mdc
 */

export type IdempotencyEndpointId =
  | 'IDM-01'
  | 'IDM-02'
  | 'IDM-03'
  | 'IDM-04'
  | 'IDM-05'
  | 'IDM-06'
  | 'IDM-07'
  | 'IDM-08'
  | 'IDM-09'
  | 'IDM-10'
  | 'IDM-11'
  | 'IDM-12'
  | 'IDM-13'
  | 'IDM-14'
  | 'IDM-15'
  | 'IDM-16'
  | 'IDM-17'
  | 'IDM-18'
  | 'IDM-19'
  | 'IDM-20'
  | 'IDM-21'
  | 'IDM-22'
  | 'IDM-23';

export type IdempotencyEndpointEntry = {
  id: IdempotencyEndpointId;
  method: 'POST' | 'PUT';
  /** Path template sau `/v1` */
  path: string;
  actor: string;
  priority: 'P0' | 'P1';
  /** Web portal (greenlens-portal) đã wire idempotencyKey */
  webImplemented: boolean;
  /** Mobile app — ngoài repo web */
  mobileTarget: boolean;
  note?: string;
};

/** Danh sách đầy đủ — cập nhật `webImplemented` khi wire xong. */
export const IDEMPOTENCY_ENDPOINTS: readonly IdempotencyEndpointEntry[] = [
  // P0
  {
    id: 'IDM-01',
    method: 'POST',
    path: '/reports',
    actor: 'Citizen',
    priority: 'P0',
    webImplemented: false,
    mobileTarget: true,
    note: 'Gửi báo cáo — Mobile Citizen',
  },
  {
    id: 'IDM-02',
    method: 'POST',
    path: '/auth/register',
    actor: 'Citizen',
    priority: 'P0',
    webImplemented: false,
    mobileTarget: true,
    note: 'Đăng ký — wire khi có RegisterScreen',
  },
  {
    id: 'IDM-03',
    method: 'POST',
    path: '/auth/google-login',
    actor: 'Citizen',
    priority: 'P0',
    webImplemented: false,
    mobileTarget: true,
  },
  // P1 Citizen / field
  {
    id: 'IDM-04',
    method: 'POST',
    path: '/reports/{id}/rate',
    actor: 'Citizen',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
  },
  {
    id: 'IDM-05',
    method: 'PUT',
    path: '/reports/{id}/close',
    actor: 'Citizen',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
  },
  {
    id: 'IDM-06',
    method: 'POST',
    path: '/reports/{id}/reopen-requests',
    actor: 'Citizen',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
  },
  {
    id: 'IDM-07',
    method: 'POST',
    path: '/reports/{reportId}/comments',
    actor: 'All roles',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
    note: 'Wire khi có fetchComment.ts',
  },
  {
    id: 'IDM-08',
    method: 'POST',
    path: '/community-cleanups/{eventId}/join',
    actor: 'Citizen',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
  },
  {
    id: 'IDM-09',
    method: 'POST',
    path: '/community-cleanups/{eventId}/check-in',
    actor: 'Citizen/Leader',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
  },
  {
    id: 'IDM-10',
    method: 'POST',
    path: '/invitations/{invitationId}/accept',
    actor: 'Citizen',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
  },
  {
    id: 'IDM-11',
    method: 'PUT',
    path: '/teams/my-tasks/{reportId}/accept',
    actor: 'Cleaner/CompanyStaff',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
  },
  {
    id: 'IDM-12',
    method: 'POST',
    path: '/teams/my-tasks/{reportId}/check-in',
    actor: 'Cleaner/CompanyStaff',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
  },
  {
    id: 'IDM-13',
    method: 'PUT',
    path: '/reports/{id}/resolve',
    actor: 'Cleaner leader',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
  },
  {
    id: 'IDM-14',
    method: 'POST',
    path: '/inspections/{id}/accept',
    actor: 'Inspector',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
  },
  {
    id: 'IDM-15',
    method: 'POST',
    path: '/inspections/{id}/confirm-arrival',
    actor: 'Inspector',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
  },
  {
    id: 'IDM-16',
    method: 'PUT',
    path: '/inspections/{id}/submit-field-report',
    actor: 'Inspector',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
  },
  {
    id: 'IDM-17',
    method: 'POST',
    path: '/auth/request-otp',
    actor: 'All',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: true,
    note: 'Wire khi có OTP flow web',
  },
  // P1 Web officer / company
  {
    id: 'IDM-18',
    method: 'PUT',
    path: '/reports/{id}/verify',
    actor: 'LEO',
    priority: 'P1',
    webImplemented: true,
    mobileTarget: false,
    note: 'adaptVerifyReport — VerifyPageClient, VerifyDetailClient',
  },
  {
    id: 'IDM-19',
    method: 'POST',
    path: '/reports/{id}/assign',
    actor: 'LEO',
    priority: 'P1',
    webImplemented: true,
    mobileTarget: false,
    note: 'adaptAssignReport — LeoAssignDialog',
  },
  {
    id: 'IDM-20',
    method: 'POST',
    path: '/reports/{id}/dispatch-to-company',
    actor: 'LEO/DEO',
    priority: 'P1',
    webImplemented: true,
    mobileTarget: false,
    note: 'adaptDispatchToCompany — LeoAssignDialog',
  },
  {
    id: 'IDM-21',
    method: 'POST',
    path: '/reports/{id}/assign-company-team',
    actor: 'CompanyManager',
    priority: 'P1',
    webImplemented: true,
    mobileTarget: false,
    note: 'adaptAssignCompanyTeam — CompanyAssignTeamDialog',
  },
  {
    id: 'IDM-23',
    method: 'PUT',
    path: '/reports/{id}/reassign-company-team',
    actor: 'CompanyManager',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: false,
    note: 'Swagger PUT { oldTeamId, newTeamId, reason } — no Idempotency-Key; adaptReassignCompanyTeam',
  },
  {
    id: 'IDM-22',
    method: 'POST',
    path: '/reports/{id}/inspections',
    actor: 'LEO',
    priority: 'P1',
    webImplemented: false,
    mobileTarget: false,
    note: 'Wire khi có inspection create flow',
  },
] as const;

/** Chỉ endpoint Web đã implement — dùng checklist PR. */
export const WEB_IDEMPOTENCY_IMPLEMENTED = IDEMPOTENCY_ENDPOINTS.filter(e => e.webImplemented);

export function getIdempotencyEndpoint(id: IdempotencyEndpointId): IdempotencyEndpointEntry {
  const entry = IDEMPOTENCY_ENDPOINTS.find(e => e.id === id);
  if (!entry) throw new Error(`Unknown idempotency endpoint: ${id}`);
  return entry;
}
