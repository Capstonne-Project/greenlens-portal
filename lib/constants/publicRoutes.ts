/**
 * Public marketing / community surfaces — no staff portal auth required.
 * Shared by `proxy.ts` (guest access) and `citizenAccess.ts` (logged-in citizen scope).
 */

export const PUBLIC_SURFACE_PREFIXES = [
  '/about',
  '/leaderboard',
  '/blog',
  '/downloads',
  '/map',
  '/privacy',
  '/c',
] as const;

export function isPublicSurfacePath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_SURFACE_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
