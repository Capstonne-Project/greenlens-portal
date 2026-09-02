'use client';

import dynamic from 'next/dynamic';

/**
 * Named export via `components/*` — not the package barrel.
 * The barrel eagerly pulls unrelated Three.js scenes (r149 sRGBEncoding) and
 * breaks the Next.js bundler.
 */
const GlobeCollection = dynamic(
  () => import('@designcodeio/threeui/components/GlobeCollection').then(m => m.GlobeCollection),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-transparent" aria-hidden />,
  }
);

/** Forest lime — soft ARGOS-style orb; muted glow on Sylva olive. */
export function GlobeCollectionIsland() {
  return (
    <GlobeCollection
      variant="energy-orb"
      className="landing-globe-orb"
      hue={118}
      saturation={0.52}
      glow={0.62}
      brightness={1.02}
      smokeStrength={0.48}
      starDensity={0.85}
      starSize={0.75}
    />
  );
}
