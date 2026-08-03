import type { Metadata } from 'next';
import { RecurrenceCandidateDetailClient } from '@/components/officer/recurrence/RecurrenceCandidateDetailClient';

export const metadata: Metadata = {
  title: 'Chi tiết tái phát',
};

/** `/officer/recurrence/[id]` — so sánh nghi tái phát vs báo cáo Closed (BR-REP-034). */
export default function OfficerRecurrenceCandidateDetailPage() {
  return <RecurrenceCandidateDetailClient />;
}
