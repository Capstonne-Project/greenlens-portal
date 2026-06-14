import { VerifyDeoOnly } from '@/components/officer/VerifyDeoOnly';
import { VerifyDetailClient } from '@/components/officer/VerifyDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OfficerVerifyDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <VerifyDeoOnly>
      <VerifyDetailClient id={id} />
    </VerifyDeoOnly>
  );
}
