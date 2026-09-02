'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { LANDING_FAQ, type LandingFaqItem } from '@/lib/constants/landingFaq';

function FaqCard({
  item,
  open,
  onToggle,
}: {
  item: LandingFaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  const answerId = `landing-faq-answer-${item.id}`;
  const questionId = `landing-faq-question-${item.id}`;

  return (
    <article className={`landing-faq-card${open ? ' landing-faq-card--open' : ''}`}>
      <h3 className="landing-faq-card__heading">
        <button
          type="button"
          className="landing-faq-card__trigger"
          aria-expanded={open}
          aria-controls={answerId}
          id={questionId}
          onClick={onToggle}
        >
          <span className="landing-faq-card__icon" aria-hidden>
            <Plus className="size-4" strokeWidth={2.25} />
          </span>
          <span className="landing-faq-card__question">{item.question}</span>
        </button>
      </h3>
      <div
        id={answerId}
        role="region"
        aria-labelledby={questionId}
        className="landing-faq-card__panel"
        data-open={open}
      >
        <div className="landing-faq-card__panel-inner">
          <p className="landing-faq-card__answer">{item.answer}</p>
        </div>
      </div>
    </article>
  );
}

/** ARGOS-style FAQ grid — plus icon toggles answer with smooth accordion motion. */
export function LandingFaqSection() {
  const { eyebrow, title, items } = LANDING_FAQ;
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <section className="landing-faq" aria-labelledby="landing-faq-title">
      <div className="landing-hit landing-shell landing-faq__intro">
        <p className="landing-faq__eyebrow">{eyebrow}</p>
        <h2 id="landing-faq-title" className="landing-faq__title">
          {title}
        </h2>
      </div>

      <div className="landing-hit landing-shell landing-faq__grid">
        {items.map(item => (
          <FaqCard
            key={item.id}
            item={item}
            open={openIds.has(item.id)}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
