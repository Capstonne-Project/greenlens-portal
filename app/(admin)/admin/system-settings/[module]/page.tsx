import { AdminSystemSettingsView } from '@/components/admin/system-settings/AdminSystemSettingsView';

interface Props {
  params: Promise<{ module: string }>;
}

export default async function AdminSystemSettingsModulePage({ params }: Props) {
  const { module } = await params;
  return <AdminSystemSettingsView moduleSlug={decodeURIComponent(module)} />;
}
