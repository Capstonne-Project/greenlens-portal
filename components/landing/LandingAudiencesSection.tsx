'use client';

import Link from 'next/link';
import { useCallback, useRef, type PointerEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { LANDING_AUDIENCES, type LandingAudienceItem } from '@/lib/constants/landingAudiences';

function isApkHref(href: string) {
  return href.endsWith('.apk') || /^https?:\/\//i.test(href);
}

function AudienceCardCta({ item }: { item: LandingAudienceItem }) {
  const content = (
    <>
      {item.ctaLabel}
      <ArrowRight className="size-4" aria-hidden />
    </>
  );

  if (isApkHref(item.href)) {
    const external = /^https?:\/\//i.test(item.href);
    return (
      <a
        href={item.href}
        className="landing-audience-card__cta"
        download={external ? undefined : true}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className="landing-audience-card__cta">
      {content}
    </Link>
  );
}

function AudienceSpotlightCard({ item }: { item: LandingAudienceItem }) {
  const cardRef = useRef<HTMLElement>(null);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (window.matchMedia('(hover: none)').matches) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    card.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`);
  }, []);

  const handlePointerEnter = useCallback(() => {
    cardRef.current?.style.setProperty('--spotlight-opacity', '1');
  }, []);

  const handlePointerLeave = useCallback(() => {
    cardRef.current?.style.setProperty('--spotlight-opacity', '0');
  }, []);

  return (
    <article
      ref={cardRef}
      className="landing-audience-card"
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div className="landing-audience-card__spotlight" aria-hidden />
      <div className="landing-audience-card__content">
        <h3 className="landing-audience-card__title">{item.title}</h3>
        <p className="landing-audience-card__description">{item.description}</p>
        <AudienceCardCta item={item} />
      </div>
    </article>
  );
}

/** Mapbox-style audience grid — mouse-follow spotlight within each card. */
export function LandingAudiencesSection() {
  const { eyebrow, title, subtitle, items } = LANDING_AUDIENCES;

  return (
    <section className="landing-audiences">
      <div className="landing-hit landing-shell">
        <header className="landing-audiences__intro">
          <p className="landing-section-eyebrow">{eyebrow}</p>
          <h2 className="landing-audiences__title">{title}</h2>
          <p className="landing-audiences__subtitle">{subtitle}</p>
        </header>

        <div className="landing-audiences__grid">
          {items.map(item => (
            <AudienceSpotlightCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
