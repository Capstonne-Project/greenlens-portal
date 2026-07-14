'use client';

/**
 * ImageZoomPane — wheel zoom + drag pan (native browser, no zoom library).
 *
 * Config: `IMAGE_ZOOM` bên dưới.
 * Cơ chế: DOM `wheel` + Pointer Events + CSS `transform`.
 * Dùng: `layout-grid` lightbox · reusable mọi chỗ cần 1 ảnh zoom.
 *
 * UX: scroll = zoom về con trỏ · kéo = pan · double-click = reset 100%.
 *
 * Đọc nhanh:
 * - Config → `IMAGE_ZOOM`
 * - Math → `zoomFromWheel` / `clampPan`
 * - Wire wheel → `useWheelZoom` (effect mỏng)
 */

import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
} from 'react';

/** @public — mọi chỉnh zoom production đều ở object này. */
export const IMAGE_ZOOM = {
  min: 1,
  max: 5,
  /** Hệ số mỗi lần scroll (vd. 1.12 ≈ +12%). */
  factor: 1.12,
} as const;

type ZoomTransform = { scale: number; x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function applyCssTransform(el: HTMLElement, t: ZoomTransform) {
  el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.scale})`;
}

/** Giữ ảnh trong khung khi scale > 1 (origin top-left). */
function clampPan(el: HTMLElement, scale: number, x: number, y: number): ZoomTransform {
  if (scale <= IMAGE_ZOOM.min) return { scale: IMAGE_ZOOM.min, x: 0, y: 0 };
  const { width: w, height: h } = el.getBoundingClientRect();
  return {
    scale,
    x: clamp(x, w * (1 - scale), 0),
    y: clamp(y, h * (1 - scale), 0),
  };
}

/** Math zoom-to-point từ WheelEvent — pure, dễ test / đọc. */
function zoomFromWheel(e: WheelEvent, el: HTMLElement, cur: ZoomTransform): ZoomTransform | null {
  const rect = el.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const factor = e.deltaY < 0 ? IMAGE_ZOOM.factor : 1 / IMAGE_ZOOM.factor;
  const next = clamp(Number((cur.scale * factor).toFixed(3)), IMAGE_ZOOM.min, IMAGE_ZOOM.max);
  if (next === cur.scale) return null;

  const ratio = next / cur.scale;
  const x = next <= IMAGE_ZOOM.min ? 0 : mx - (mx - cur.x) * ratio;
  const y = next <= IMAGE_ZOOM.min ? 0 : my - (my - cur.y) * ratio;
  return clampPan(el, next, x, y);
}

export type ImageZoomPaneProps = {
  src: string;
  alt?: string;
  className?: string;
};

export function ImageZoomPane({ src, alt = 'Ảnh', className }: ImageZoomPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tRef = useRef<ZoomTransform>({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef({ active: false, px: 0, py: 0, ox: 0, oy: 0 });
  const [scaleUi, setScaleUi] = useState(1);

  useWheelZoom(containerRef, contentRef, tRef, setScaleUi);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (tRef.current.scale <= IMAGE_ZOOM.min) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      px: e.clientX,
      py: e.clientY,
      ox: tRef.current.x,
      oy: tRef.current.y,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const el = containerRef.current;
    const content = contentRef.current;
    if (!d.active || !el || !content) return;

    const next = clampPan(
      el,
      tRef.current.scale,
      d.ox + (e.clientX - d.px),
      d.oy + (e.clientY - d.py)
    );
    tRef.current = next;
    applyCssTransform(content, next);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const handleDoubleClick = () => {
    const next = { scale: 1, x: 0, y: 0 };
    tRef.current = next;
    if (contentRef.current) applyCssTransform(contentRef.current, next);
    setScaleUi(1);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute inset-0 touch-none select-none overflow-hidden',
        scaleUi > IMAGE_ZOOM.min ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      role="img"
      aria-label="Cuộn chuột để phóng to / thu nhỏ; kéo để di chuyển; double-click để reset"
    >
      <div
        ref={contentRef}
        className="absolute inset-0 will-change-transform"
        style={{ transformOrigin: '0 0' }}
      >
        <div className="absolute inset-0">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="100vw"
            className="object-contain object-center"
            unoptimized
            priority
            draggable={false}
          />
        </div>
      </div>
      {scaleUi > IMAGE_ZOOM.min ? (
        <div className="pointer-events-none absolute top-3 right-3 z-20 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white tabular-nums">
          {Math.round(scaleUi * 100)}%
        </div>
      ) : null}
    </div>
  );
}

/** Effect mỏng: chỉ gắn `wheel`. Math → `zoomFromWheel`. */
function useWheelZoom(
  containerRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  tRef: RefObject<ZoomTransform>,
  setScaleUi: Dispatch<SetStateAction<number>>
) {
  useEffect(() => {
    const el = containerRef.current;
    const content = contentRef.current;
    if (!el || !content) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const next = zoomFromWheel(e, el, tRef.current);
      if (!next) return;
      tRef.current = next;
      applyCssTransform(content, next);
      setScaleUi(next.scale);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [containerRef, contentRef, tRef, setScaleUi]);
}
