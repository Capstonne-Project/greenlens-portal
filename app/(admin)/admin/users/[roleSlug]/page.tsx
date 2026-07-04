import { AdminUsersView } from '@/components/admin/users/AdminUsersView';
import { getApiRoleFromSlug, isValidUsersRoleSlug } from '@/lib/constants/adminUsersNav';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

const LEGACY_SLUG_REDIRECT: Record<string, string> = {
  'can-bo-moi-truong': 'thanh-tra',
  'doi-don-dep': 'don-dep',
};

interface PageProps {
  params: Promise<{ roleSlug: string }>;
}

function UsersFallback() {
  return (
    <div className="w-full min-w-0 animate-pulse space-y-6">
      <div className="h-10 w-64 rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-card bg-muted" />
        ))}
      </div>
      <div className="h-12 rounded-card bg-muted" />
      <div className="h-[420px] rounded-card bg-muted" />
    </div>
  );
}

export default async function AdminUsersByRolePage({ params }: PageProps) {
  const { roleSlug } = await params;

  const legacyTarget = LEGACY_SLUG_REDIRECT[roleSlug];
  if (legacyTarget) {
    redirect(`/admin/users/${legacyTarget}`);
  }

  if (!isValidUsersRoleSlug(roleSlug)) {
    notFound();
  }

  const apiRole = getApiRoleFromSlug(roleSlug);

  return (
    <Suspense fallback={<UsersFallback />}>
      <AdminUsersView apiRole={apiRole} key={roleSlug} />
    </Suspense>
  );
}
