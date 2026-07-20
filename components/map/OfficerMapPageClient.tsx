'use client';

import dynamic from 'next/dynamic';

function MapFallback() {
  return <div className="absolute inset-0 z-0 animate-pulse bg-slate-200" aria-hidden />;
}

const OfficerMapInner = dynamic(() => import('./OfficerMapInner').then(m => m.OfficerMapInner), {
  ssr: false,
  loading: MapFallback,
});

export function OfficerMapPageClient() {
  return <OfficerMapInner />;
}
