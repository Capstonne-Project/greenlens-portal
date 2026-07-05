/** Nền trang trí nhẹ — tránh lặp card trắng. */
export function CompanyAmbient() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -left-32 top-0 size-[28rem] rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-900/15" />
      <div className="absolute -right-24 bottom-0 size-80 rounded-full bg-teal-100/40 blur-3xl dark:bg-teal-950/20" />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(16 185 129 / 0.12) 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
      />
    </div>
  );
}
