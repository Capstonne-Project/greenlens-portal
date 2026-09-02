'use client';

import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';

type Point = { x: number; y: number };

type ConnectorPathData = {
  id: string;
  d: string;
};

const GLOW_SEGMENT_MIN = 112;
const GLOW_SEGMENT_MAX = 188;
const HIT_RADIUS_PX = 28;
const CORNER_RADIUS = 30;
const PHONE_ANCHOR_SELECTOR = '[data-landing-step-phone]';

function fmt(n: number): string {
  return n.toFixed(1);
}

/**
 * Mapbox-style stepped connector with smooth fillet corners (quadratic, tangent-continuous).
 */
function buildOrthogonalPath(from: Point, to: Point): string {
  const verticalGap = to.y - from.y;
  const elbowY = from.y + Math.max(52, verticalGap * 0.44);
  const dx = to.x - from.x;
  const segmentDown = elbowY - from.y;
  const segmentDown2 = to.y - elbowY;

  if (Math.abs(dx) < 2) {
    return `M ${fmt(from.x)} ${fmt(from.y)} L ${fmt(to.x)} ${fmt(to.y)}`;
  }

  const radius = Math.min(
    CORNER_RADIUS,
    segmentDown * 0.48,
    segmentDown2 * 0.48,
    Math.abs(dx) * 0.48
  );

  if (radius < 6) {
    return `M ${fmt(from.x)} ${fmt(from.y)} L ${fmt(from.x)} ${fmt(elbowY)} L ${fmt(to.x)} ${fmt(elbowY)} L ${fmt(to.x)} ${fmt(to.y)}`;
  }

  const signX = dx > 0 ? 1 : -1;
  const corner1X = from.x + signX * radius;
  const corner2Y = elbowY + radius;

  return [
    `M ${fmt(from.x)} ${fmt(from.y)}`,
    `L ${fmt(from.x)} ${fmt(elbowY - radius)}`,
    `Q ${fmt(from.x)} ${fmt(elbowY)} ${fmt(corner1X)} ${fmt(elbowY)}`,
    `L ${fmt(to.x - signX * radius)} ${fmt(elbowY)}`,
    `Q ${fmt(to.x)} ${fmt(elbowY)} ${fmt(to.x)} ${fmt(corner2Y)}`,
    `L ${fmt(to.x)} ${fmt(to.y)}`,
  ].join(' ');
}

function getRelativeRect(el: HTMLElement, container: HTMLElement) {
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  return {
    left: elRect.left - containerRect.left,
    top: elRect.top - containerRect.top,
    right: elRect.right - containerRect.left,
    bottom: elRect.bottom - containerRect.top,
    width: elRect.width,
    height: elRect.height,
    centerX: elRect.left + elRect.width / 2 - containerRect.left,
    centerY: elRect.top + elRect.height / 2 - containerRect.top,
  };
}

function getClosestPointOnPath(
  path: SVGPathElement,
  clientX: number,
  clientY: number
): { length: number; distancePx: number } {
  const svg = path.ownerSVGElement;
  if (!svg) return { length: 0, distancePx: Infinity };

  const ctm = path.getScreenCTM();
  if (!ctm) return { length: 0, distancePx: Infinity };

  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const local = pt.matrixTransform(ctm.inverse());

  const total = path.getTotalLength();
  if (total <= 0) return { length: 0, distancePx: Infinity };

  let bestLen = 0;
  let bestDistSq = Infinity;

  const coarseSteps = 140;
  for (let i = 0; i <= coarseSteps; i++) {
    const len = (i / coarseSteps) * total;
    const p = path.getPointAtLength(len);
    const distSq = (p.x - local.x) ** 2 + (p.y - local.y) ** 2;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestLen = len;
    }
  }

  const window = total / coarseSteps;
  const refineStart = Math.max(0, bestLen - window);
  const refineEnd = Math.min(total, bestLen + window);

  for (let i = 0; i <= 32; i++) {
    const len = refineStart + ((refineEnd - refineStart) * i) / 32;
    const p = path.getPointAtLength(len);
    const distSq = (p.x - local.x) ** 2 + (p.y - local.y) ** 2;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestLen = len;
    }
  }

  const closest = path.getPointAtLength(bestLen);
  const screenPt = svg.createSVGPoint();
  screenPt.x = closest.x;
  screenPt.y = closest.y;
  const onScreen = screenPt.matrixTransform(ctm);
  const dx = onScreen.x - clientX;
  const dy = onScreen.y - clientY;

  return {
    length: bestLen,
    distancePx: Math.sqrt(dx * dx + dy * dy),
  };
}

function glowSegmentLength(totalLength: number): number {
  if (totalLength <= 0) return GLOW_SEGMENT_MIN;
  return Math.min(GLOW_SEGMENT_MAX, Math.max(GLOW_SEGMENT_MIN, totalLength * 0.32));
}

function ConnectorPath({ d, reducedMotion }: { d: string; reducedMotion: boolean }) {
  const lineRef = useRef<SVGPathElement>(null);
  const hitRef = useRef<SVGPathElement>(null);
  const [hoverLength, setHoverLength] = useState<number | null>(null);
  const [totalLength, setTotalLength] = useState(0);

  useLayoutEffect(() => {
    const path = lineRef.current;
    if (!path) return;
    setTotalLength(path.getTotalLength());
  }, [d]);

  const handlePointerMove = useCallback(
    (event: PointerEvent<SVGPathElement>) => {
      if (reducedMotion) return;
      const path = hitRef.current;
      if (!path) return;

      const { length, distancePx } = getClosestPointOnPath(path, event.clientX, event.clientY);
      if (distancePx <= HIT_RADIUS_PX) {
        setHoverLength(length);
        return;
      }
      setHoverLength(null);
    },
    [reducedMotion]
  );

  const handlePointerLeave = useCallback(() => {
    setHoverLength(null);
  }, []);

  const glowLength = glowSegmentLength(totalLength);
  const glowOffset = hoverLength !== null && totalLength > 0 ? -(hoverLength - glowLength / 2) : 0;

  return (
    <g className="landing-how-connectors__segment">
      <path ref={lineRef} d={d} className="landing-how-connectors__line" />
      <path
        ref={hitRef}
        d={d}
        className="landing-how-connectors__hit"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      />
      {!reducedMotion && hoverLength !== null && totalLength > 0 ? (
        <path
          d={d}
          className="landing-how-connectors__glow"
          strokeDasharray={`${glowLength} ${Math.max(totalLength, 1)}`}
          strokeDashoffset={glowOffset}
        />
      ) : null}
    </g>
  );
}

/** Mapbox-style orthogonal connectors between step iPhones + cursor-follow glow. */
export function LandingHowItWorksConnectors() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<ConnectorPathData[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  const getStepsContainer = useCallback((): HTMLElement | null => {
    return overlayRef.current?.parentElement ?? null;
  }, []);

  const updatePaths = useCallback(() => {
    const container = getStepsContainer();
    if (!container) return;

    const phones = Array.from(container.querySelectorAll<HTMLElement>(PHONE_ANCHOR_SELECTOR));
    if (phones.length < 2) {
      setPaths([]);
      return;
    }

    const width = container.offsetWidth;
    const height = container.offsetHeight;
    setSvgSize({ width, height });

    const nextPaths: ConnectorPathData[] = [];

    for (let i = 0; i < phones.length - 1; i++) {
      const fromPhone = phones[i];
      const toPhone = phones[i + 1];
      if (!fromPhone || !toPhone) continue;

      const fromRect = getRelativeRect(fromPhone, container);
      const toRect = getRelativeRect(toPhone, container);

      const from: Point = {
        x: fromRect.centerX,
        y: fromRect.bottom + 10,
      };
      const to: Point = {
        x: toRect.centerX,
        y: toRect.top - 10,
      };

      if (to.y <= from.y + 24) continue;

      nextPaths.push({
        id: `step-${i + 1}-to-${i + 2}`,
        d: buildOrthogonalPath(from, to),
      });
    }

    setPaths(nextPaths);
  }, [getStepsContainer]);

  useLayoutEffect(() => {
    const container = getStepsContainer();
    if (!container) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(motionQuery.matches);
    syncMotion();
    motionQuery.addEventListener('change', syncMotion);

    const images = container.querySelectorAll('img');
    const onImageReady = () => updatePaths();
    images.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', onImageReady);
        img.addEventListener('error', onImageReady);
      }
    });

    const resizeObserver = new ResizeObserver(() => updatePaths());
    resizeObserver.observe(container);

    window.addEventListener('resize', updatePaths);

    const raf = requestAnimationFrame(() => {
      updatePaths();
      requestAnimationFrame(updatePaths);
    });

    return () => {
      motionQuery.removeEventListener('change', syncMotion);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePaths);
      cancelAnimationFrame(raf);
      images.forEach(img => {
        img.removeEventListener('load', onImageReady);
        img.removeEventListener('error', onImageReady);
      });
    };
  }, [getStepsContainer, updatePaths]);

  return (
    <div ref={overlayRef} className="landing-how-connectors" aria-hidden>
      {svgSize.width > 0 && svgSize.height > 0 && paths.length > 0 ? (
        <svg
          className="landing-how-connectors__svg"
          width={svgSize.width}
          height={svgSize.height}
          viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="landing-how-line-blur" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {paths.map(path => (
            <ConnectorPath key={path.id} d={path.d} reducedMotion={reducedMotion} />
          ))}
        </svg>
      ) : null}
    </div>
  );
}
