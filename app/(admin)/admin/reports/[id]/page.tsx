import { AdminReportDetailView } from '@/components/admin/reports/AdminReportDetailView';

interface AdminReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminReportDetailPage({ params }: AdminReportDetailPageProps) {
  const { id } = await params;
  return <AdminReportDetailView reportId={id} />;
}
