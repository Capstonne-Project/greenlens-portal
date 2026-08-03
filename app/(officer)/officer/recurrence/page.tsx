import type { Metadata } from 'next';
import { RecurrencePageClient } from '@/components/officer/recurrence/RecurrencePageClient';

export const metadata: Metadata = {
  title: 'Báo cáo tái phát',
};

export default function OfficerRecurrencePage() {
  return <RecurrencePageClient />;
}
