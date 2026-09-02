import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { LandingHowItWorksConnectors } from '@/components/landing/LandingHowItWorksConnectors';
import { LandingStepPhone } from '@/components/landing/LandingStepPhone';
import {
  LANDING_HOW_IT_WORKS,
  LANDING_HOW_IT_WORKS_STEPS,
} from '@/lib/constants/landingHowItWorks';
import { ANDROID_APK_HREF, getAndroidApkLinkProps } from '@/lib/constants/publicSite';

function isApkHref(href: string): boolean {
  return href === ANDROID_APK_HREF || href.endsWith('.apk');
}

function StepCta({ href, label }: { href: string; label: string }) {
  const className = 'landing-how-step-cta group';
  const icon = (
    <ArrowRight
      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
      aria-hidden
    />
  );

  if (isApkHref(href)) {
    return (
      <a {...getAndroidApkLinkProps(href)} className={className}>
        {label}
        {icon}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
      {icon}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="landing-section-eyebrow">{children}</p>;
}

export function LandingHowItWorksSection() {
  const { eyebrow, title, subtitle } = LANDING_HOW_IT_WORKS;

  return (
    <section className="landing-how" aria-labelledby="landing-how-title">
      <div className="landing-hit landing-shell landing-how-intro">
        <SectionLabel>{eyebrow}</SectionLabel>
        <h2 id="landing-how-title" className="landing-how-title">
          {title}
        </h2>
        <p className="landing-how-subtitle">{subtitle}</p>
      </div>

      <div className="landing-hit landing-shell landing-how-steps">
        <LandingHowItWorksConnectors />
        {LANDING_HOW_IT_WORKS_STEPS.map((step, index) => {
          const reverse = index % 2 === 1;
          return (
            <article
              key={step.id}
              className={`landing-how-step ${reverse ? 'landing-how-step--reverse' : ''}`}
            >
              <div className="landing-how-step-copy">
                <p className="landing-how-step-index">
                  <span className="landing-hero-kicker-dot" aria-hidden />
                  Bước {step.step}
                </p>
                <h3 className="landing-how-step-title">{step.title}</h3>
                <p className="landing-how-step-body">{step.body}</p>
                <ul className="landing-how-step-list">
                  {step.highlights.map(point => (
                    <li key={point} className="landing-how-step-list-item">
                      <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
                {step.cta ? <StepCta href={step.cta.href} label={step.cta.label} /> : null}
              </div>

              <div className="landing-how-step-media">
                <LandingStepPhone
                  imageSrc={step.imageSrc}
                  alt={step.imageAlt}
                  sideImageSrc={step.sideImageSrc}
                  sideImageAlt={step.sideImageAlt}
                  leftImageSrc={step.leftImageSrc}
                  leftImageAlt={step.leftImageAlt}
                  priority={index === 0}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
