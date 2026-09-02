/**
 * Public URLs required by `@designcodeio/threeui` SylvaLivingWorldScene.
 *
 * The scene injects HTML via iframe `srcDoc`. Relative paths such as
 * `inner-green-assets/lexend-latin.woff2` resolve against the page origin
 * (`/inner-green-assets/...`), not the npm package — so we mirror vendor files
 * into `public/` via `npm run sync:threeui`.
 *
 * @see scripts/sync-threeui-sylva-assets.mjs
 */
export const SYLVA_PUBLIC_ASSET_DIR = '/inner-green-assets' as const;

/** Filenames copied from the threeui package into `public/inner-green-assets/`. */
export const SYLVA_PUBLIC_ASSET_FILES = ['lexend-latin.woff2'] as const;

export type SylvaPublicAssetFile = (typeof SYLVA_PUBLIC_ASSET_FILES)[number];

export function getSylvaPublicAssetUrl(file: SylvaPublicAssetFile): string {
  return `${SYLVA_PUBLIC_ASSET_DIR}/${file}`;
}
