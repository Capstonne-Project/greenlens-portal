import { MyWardCompanyDetailClient } from '@/components/officer/companies/MyWardCompanyDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfficerMyCompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <MyWardCompanyDetailClient companyId={id} />;
}
