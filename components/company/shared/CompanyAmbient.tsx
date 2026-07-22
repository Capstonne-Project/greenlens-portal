/** Nền trang trí nhẹ — flat colors only, no gradients. */
export function CompanyAmbient() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-zinc-50 dark:bg-background"
      aria-hidden
    />
  );
}
