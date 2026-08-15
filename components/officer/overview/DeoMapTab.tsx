'use client';

import type { DeoGeographicData } from '@/lib/api/services/fetchDeoDashboard';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const AdminDashboardGeographicMap = dynamic(
  () =>
    import('@/components/admin/overview/AdminDashboardGeographicMap').then(
      mod => mod.AdminDashboardGeographicMap
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full min-h-60 animate-pulse rounded-lg border border-border bg-muted"
        aria-hidden
      />
    ),
  }
);

export function DeoMapTab({
  geographic,
  title = 'Bản đồ Sở',
  subtitle = 'Heatmap và marker báo cáo trong địa bàn',
}: {
  geographic: DeoGeographicData | undefined;
  title?: string;
  subtitle?: string;
}) {
  const [mapExpanded, setMapExpanded] = useState(false);

  const mapNode = (
    <AdminDashboardGeographicMap
      geographic={geographic}
      fillHeight
      expanded={mapExpanded}
      onToggleExpand={() => setMapExpanded(prev => !prev)}
    />
  );

  return (
    <>
      <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card border border-border bg-card p-3 shadow-sm">
        <header className="mb-1.5 shrink-0">
          <h2 className="text-xs font-semibold text-foreground sm:text-sm">{title}</h2>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </header>
        <div className="min-h-0 flex-1">{mapExpanded ? null : mapNode}</div>
      </article>

      {mapExpanded ? (
        <div
          className="fixed inset-0 z-100 flex flex-col bg-background p-3"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} toàn màn hình`}
        >
          <div className="mb-2 shrink-0">
            <h2 className="text-sm font-semibold text-foreground">{title} — toàn màn hình</h2>
          </div>
          <div className="min-h-0 flex-1">{mapNode}</div>
        </div>
      ) : null}
    </>
  );
}
