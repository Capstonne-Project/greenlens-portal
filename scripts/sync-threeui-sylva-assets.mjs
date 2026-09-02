/**
 * Mirrors Sylva iframe assets from @designcodeio/threeui into public/.
 *
 * Root cause: SylvaLivingWorldScene uses srcDoc; relative font URLs hit the app
 * origin and 404 unless we host the vendor files under public/inner-green-assets/.
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Package ships the font under landing-pages assets, not the sylva sources folder. */
const VENDOR_DIR = join(
  ROOT,
  'node_modules/@designcodeio/threeui/lib-dist/assets/landing-pages/inner-green-assets'
);

const PUBLIC_DIR = join(ROOT, 'public/inner-green-assets');

const ASSETS = ['lexend-latin.woff2'];

async function sync() {
  await mkdir(PUBLIC_DIR, { recursive: true });

  for (const file of ASSETS) {
    const from = join(VENDOR_DIR, file);
    const to = join(PUBLIC_DIR, file);
    await copyFile(from, to);
    console.log(`sync-threeui-sylva-assets: ${file}`);
  }
}

sync().catch(err => {
  console.warn(
    'sync-threeui-sylva-assets: skipped — install @designcodeio/threeui first.',
    err instanceof Error ? err.message : err
  );
  process.exit(0);
});
