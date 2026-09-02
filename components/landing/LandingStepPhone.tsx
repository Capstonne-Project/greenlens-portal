import Image from 'next/image';
import { Iphone } from '@/components/ui/iphone';

type LandingStepPhoneProps = {
  imageSrc: string;
  alt: string;
  sideImageSrc?: string;
  sideImageAlt?: string;
  leftImageSrc?: string;
  leftImageAlt?: string;
};

function WingPanel({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(min-width: 1024px) 260px, 200px"
      className="object-cover object-top"
    />
  );
}

/** Step phone — Magic UI iPhone With Image; optional Mapbox-style wing panels. */
export function LandingStepPhone({
  imageSrc,
  alt,
  sideImageSrc,
  sideImageAlt,
  leftImageSrc,
  leftImageAlt,
}: LandingStepPhoneProps) {
  const hasRightWing = Boolean(sideImageSrc);
  const hasLeftWing = Boolean(leftImageSrc);
  const hasShowcase = hasRightWing || hasLeftWing;

  if (!hasShowcase) {
    return (
      <figure className="landing-how-step-phone" aria-label={alt}>
        <Iphone src={imageSrc} alt={alt} frame="black" />
      </figure>
    );
  }

  const isTriple = hasLeftWing && hasRightWing && leftImageSrc && sideImageSrc;
  const isDuo = hasRightWing && !isTriple;

  return (
    <figure
      className={[
        'landing-how-step-showcase',
        isTriple ? 'landing-how-step-showcase--triple' : '',
        isDuo ? 'landing-how-step-showcase--duo' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={alt}
    >
      {hasLeftWing && leftImageSrc ? (
        <div
          className="landing-how-step-showcase__wing landing-how-step-showcase__wing--left"
          aria-hidden
        >
          <WingPanel src={leftImageSrc} alt={leftImageAlt ?? ''} />
        </div>
      ) : null}

      {isDuo && sideImageSrc ? (
        <div
          className="landing-how-step-showcase__wing landing-how-step-showcase__wing--right"
          aria-hidden
        >
          <WingPanel src={sideImageSrc} alt={sideImageAlt ?? ''} />
        </div>
      ) : null}

      <div className="landing-how-step-showcase__phone landing-how-step-phone">
        <Iphone src={imageSrc} alt={alt} frame="black" />
      </div>

      {!isDuo && hasRightWing && sideImageSrc ? (
        <div
          className="landing-how-step-showcase__wing landing-how-step-showcase__wing--right"
          aria-hidden
        >
          <WingPanel src={sideImageSrc} alt={sideImageAlt ?? ''} />
        </div>
      ) : null}
    </figure>
  );
}
