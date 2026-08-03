import type { Metadata } from 'next';
import { DuplicatesPageClient } from '@/components/officer/duplicates/DuplicatesPageClient';

export const metadata: Metadata = {
  title: 'Trùng lặp',
};

export default function OfficerDuplicatesPage() {
  return <DuplicatesPageClient />;
}
