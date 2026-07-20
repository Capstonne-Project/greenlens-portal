import { VerifyDetailRouteClient } from '@/components/officer/verify/VerifyDetailRouteClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfficerVerifyDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <VerifyDetailRouteClient id={id} />;
}
