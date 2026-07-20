'use client';

/**
 * LayoutGrid — bento / hero5 mosaic + lightbox expand (Aceternity-style layoutId).
 *
 * Zoom/pan ảnh sau khi mở lightbox → `components/ui/image-zoom-pane.tsx` (`IMAGE_ZOOM`).
 */

import { ImageZoomPane } from '@/components/ui/image-zoom-pane';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Client-only flag — tránh createPortal trên SSR mà không dùng setState trong useEffect. */
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export type LayoutGridCard = {
  id: string | number;
  content: ReactNode;
  className: string;
  thumbnail: string;
  /** Overlay trên thumbnail (vd. nút "Xem gallery") — click không trigger expand. */
  overlay?: ReactNode;
};

export type LayoutGridVariant = 'bento' | 'hero5';

type LayoutGridProps = {
  cards: LayoutGridCard[];
  /** `hero5` = 1 lớn trái + tối đa 4 nhỏ phải (Revoland-style). */
  variant?: LayoutGridVariant;
  className?: string;
};

/**
 * Span classes cho mosaic tối đa 5 ảnh:
 * - 5: trái 50% full-height, phải 2×2
 * - ít hơn 5: vẫn ưu tiên ảnh đầu lớn bên trái
 */
export function hero5CardClass(index: number, total: number): string {
  if (total <= 0) return '';
  if (total === 1) return 'col-span-2 row-span-2 md:col-span-4';
  if (total === 2) {
    return 'col-span-1 row-span-2 md:col-span-2';
  }
  if (total === 3) {
    if (index === 0) return 'col-span-1 row-span-2 md:col-span-2 md:row-span-2';
    return 'col-span-1 row-span-1 md:col-span-2';
  }
  if (total === 4) {
    if (index === 0) return 'col-span-1 row-span-2 md:col-span-2 md:row-span-2';
    if (index === 1) return 'col-span-1 row-span-1 md:col-span-2';
    return 'col-span-1 row-span-1 md:col-span-1';
  }
  // 5+
  if (index === 0) return 'col-span-1 row-span-2 md:col-span-2 md:row-span-2';
  return 'col-span-1 row-span-1 md:col-span-1';
}

export function LayoutGrid({ cards, variant = 'bento', className }: LayoutGridProps) {
  const [selected, setSelected] = useState<LayoutGridCard | null>(null);
  const isClient = useIsClient();

  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [selected]);

  const handleClick = (card: LayoutGridCard) => {
    setSelected(card);
  };

  const handleClose = () => {
    setSelected(null);
  };

  /**
   * Portal cả backdrop + ảnh lên body cùng stacking context.
   * Zoom/pan: ImageZoomPane — không gắn layoutId lên ảnh (tránh giật với CSS transform).
   */
  const lightbox =
    isClient && selected
      ? createPortal(
          <div className="pointer-events-none fixed inset-0 z-200" role="dialog" aria-modal>
            <motion.button
              type="button"
              aria-label="Đóng xem ảnh"
              onClick={handleClose}
              className="pointer-events-auto absolute inset-0 z-0 cursor-default border-0 bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              layoutId={`card-${selected.id}`}
              onClick={e => e.stopPropagation()}
              className="pointer-events-auto absolute top-1/2 left-1/2 z-10 flex h-[min(92vh,900px)] w-[min(96vw,1100px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-2xl bg-transparent shadow-2xl"
              transition={{ type: 'spring', stiffness: 200, damping: 28 }}
            >
              <ImageZoomPane key={selected.id} src={selected.thumbnail} alt="Ảnh báo cáo" />
              <SelectedCard selected={selected} />
            </motion.div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {lightbox}
      <div
        className={cn(
          'relative mx-auto h-full w-full',
          variant === 'hero5'
            ? 'grid max-w-none grid-cols-2 grid-rows-2 gap-1 md:grid-cols-4'
            : 'grid max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-3 md:p-6',
          className
        )}
      >
        {cards.map(card => {
          const isSelected = selected?.id === card.id;
          return (
            <div key={card.id} className={cn('relative min-h-0', card.className)}>
              {isSelected ? (
                <div className="h-full w-full rounded-sm bg-muted/40" aria-hidden />
              ) : (
                <motion.div
                  onClick={() => handleClick(card)}
                  className={cn(
                    'relative h-full w-full cursor-pointer overflow-hidden bg-transparent',
                    variant === 'hero5' ? 'rounded-sm' : 'rounded-xl'
                  )}
                  layoutId={`card-${card.id}`}
                  transition={{ type: 'spring', stiffness: 200, damping: 28 }}
                >
                  <ImageComponent card={card} />
                  {card.overlay ? (
                    <div className="pointer-events-none absolute inset-0 z-20 [&_button]:pointer-events-auto">
                      {card.overlay}
                    </div>
                  ) : null}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ImageComponent({ card }: { card: LayoutGridCard }) {
  return (
    <motion.div layoutId={`image-${card.id}-image`} className="absolute inset-0">
      <Image
        src={card.thumbnail}
        alt="Ảnh báo cáo"
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover object-center"
        unoptimized
        draggable={false}
      />
    </motion.div>
  );
}

function SelectedCard({ selected }: { selected: LayoutGridCard }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex h-full w-full flex-col justify-end rounded-2xl">
      <motion.div
        layoutId={`content-${selected.id}`}
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative px-8 pb-5 [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]"
      >
        {selected.content}
      </motion.div>
    </div>
  );
}
