import { AdminAuditLogDetailView } from '@/components/admin/audit-logs/AdminAuditLogDetailView';

export default async function AdminAuditLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminAuditLogDetailView logId={id} />;
}
