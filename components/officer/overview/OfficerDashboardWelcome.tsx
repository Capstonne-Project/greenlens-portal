'use client';

import { useAuthStore } from '@/lib/store/authStore';

function displayNameFromSession(name: string | undefined, email: string | undefined): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email?.split('@')[0]?.trim();
  return local || 'cán bộ';
}

export function OfficerDashboardWelcome({ description }: { description: string }) {
  const name = useAuthStore(s => s.user?.name);
  const email = useAuthStore(s => s.user?.email);
  const greetingName = displayNameFromSession(name, email);

  return (
    <div className="min-w-0">
      <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        Chào mừng bạn đã trở lại {greetingName}!
      </h1>
      <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">{description}</p>
    </div>
  );
}
