import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LANDING_FINAL_CTA } from '@/lib/constants/landingFinalCta';
import { PUBLIC_SITE_CTA } from '@/lib/constants/publicSite';

/** Bottom CTA band — ARGOS-style chamfered “open map” button + micro footnote. */
export function LandingFinalCtaSection() {
  const { title, lead, footnote } = LANDING_FINAL_CTA;

  return (
    <section className="landing-cta-band" aria-labelledby="landing-final-cta-title">
      <div className="landing-hit landing-shell landing-cta-band__inner">
        <h2 id="landing-final-cta-title" className="landing-cta-band__title">
          {title}
        </h2>
        <p className="landing-cta-band__lead">{lead}</p>
        <Link
          href={PUBLIC_SITE_CTA.openMap.href}
          className="landing-cta-chamfer landing-cta-primary landing-cta-band__button"
        >
          {PUBLIC_SITE_CTA.openMap.label}
          <ArrowRight className="landing-cta-band__arrow" aria-hidden />
        </Link>
        <p className="landing-cta-band__footnote">{footnote}</p>
      </div>
    </section>
  );
}
