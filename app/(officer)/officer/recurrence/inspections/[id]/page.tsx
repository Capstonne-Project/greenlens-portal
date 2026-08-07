import type { Metadata } from 'next';
import { InspectionDetailClient } from '@/components/officer/recurrence/InspectionDetailClient';

export const metadata: Metadata = {
  title: 'Chi tiết hồ sơ xử phạt',
};

/** `/officer/recurrence/inspections/[id]` — GET /v1/inspections/{id}. */
export default function OfficerInspectionDetailPage() {
  return <InspectionDetailClient />;
}
