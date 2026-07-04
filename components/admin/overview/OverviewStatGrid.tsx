import type { OverviewStatCard } from '@/utils/adminOverview';
import { formatOverviewNumber } from '@/utils/adminOverview';

interface OverviewStatGridProps {
  stats: OverviewStatCard[];
}

function ProgressRing({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="flex size-14 shrink-0 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-50 text-[11px] font-bold text-emerald-800"
      style={{ background: `conic-gradient(#047857 ${clamped}%, #ecfdf5 ${clamped}% 100%)` }}
      aria-hidden
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
        {clamped}%
      </span>
    </div>
  );
}

export function OverviewStatGrid({ stats }: OverviewStatGridProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(card => (
        <article key={card.key} className="rounded-card border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-bold tracking-tight">
                {formatOverviewNumber(card.value)}
              </p>
              <p className="mt-1 text-xs text-emerald-700">{card.hint}</p>
            </div>
            <ProgressRing percent={card.ringPercent} />
          </div>
        </article>
      ))}
    </section>
  );
}
