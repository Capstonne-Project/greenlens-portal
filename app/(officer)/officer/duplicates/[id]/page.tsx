import type { Metadata } from 'next';
import { DuplicateCandidateDetailClient } from '@/components/officer/duplicates/DuplicateCandidateDetailClient';

export const metadata: Metadata = {
  title: 'Chi tiết trùng lặp',
};

/** `/officer/duplicates/[id]` — so sánh nghi trùng vs báo cáo gốc (BR-REP-031/032). */
export default function OfficerDuplicateCandidateDetailPage() {
  return <DuplicateCandidateDetailClient />;
}
