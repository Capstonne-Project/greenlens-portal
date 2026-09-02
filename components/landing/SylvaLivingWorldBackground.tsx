'use client';

import dynamic from 'next/dynamic';

/**
 * Named scene via the package `components/*` export — not the barrel.
 * The barrel (`@designcodeio/threeui`) eagerly pulls unrelated Three.js scenes
 * that target r149 APIs (e.g. sRGBEncoding) and break Next.js bundling.
 *
 * Vendor font for the iframe `srcDoc` is mirrored to `public/inner-green-assets/`
 * (see `lib/threeui/sylva-public-assets.ts` + `npm run sync:threeui`).
 */
const SylvaLivingWorldScene = dynamic(
  () =>
    import('@designcodeio/threeui/components/SylvaLivingWorldScene').then(
      m => m.SylvaLivingWorldScene
    ),
  { ssr: false }
);

/**
 * Full-viewport Sylva Living World canvas (Three.js iframe).
 * Pointer events stay off so landing islands (`landing-hit`) remain clickable.
 */
export function SylvaLivingWorldBackground() {
  return <SylvaLivingWorldScene variant="living-green" />;
}
