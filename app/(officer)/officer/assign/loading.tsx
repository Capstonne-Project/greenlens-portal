import { AssignPageClient } from '@/components/officer/assign/AssignPageClient';

/**
 * Cùng UI list (không skeleton bảng) — tránh chớp màn khi
 * `/officer/assign/[id]` → `/officer/assign` (Suspense fallback = trang thật).
 */
export default function OfficerAssignLoading() {
  return <AssignPageClient />;
}
