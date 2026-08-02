import type { Metadata } from 'next';
import { RecurrencePageClient } from '@/components/officer/recurrence/RecurrencePageClient';

export const metadata: Metadata = {
  title: 'Tái phát',
};

export default function OfficerRecurrencePage() {
  return <RecurrencePageClient />;
}
