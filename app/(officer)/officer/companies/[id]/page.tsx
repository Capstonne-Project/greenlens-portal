import { CompanyDetailClient } from '@/components/officer/companies/CompanyDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfficerCompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <CompanyDetailClient companyId={id} />;
}
