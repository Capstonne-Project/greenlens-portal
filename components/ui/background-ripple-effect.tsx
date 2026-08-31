'use client';

import React, { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type BackgroundRippleEffectProps = {
  rows?: number;
  cols?: number;
  cellSize?: number;
  /** Cell border — GreenLens default */
  borderColor?: string;
  /** Cell fill — GreenLens default */
  fillColor?: string;
  /** Inset shadow tint */
  shadowColor?: string;
  className?: string;
  /** When false, cells ignore pointer (content sits above). */
  interactive?: boolean;
};

/**
 * Aceternity UI — Background Ripple Effect (adapted for GreenLens).
 * @see https://ui.aceternity.com/components/background-ripple-effect
 */
export function BackgroundRippleEffect({
  rows = 8,
  cols = 27,
  cellSize = 56,
  borderColor = 'rgb(63 107 50 / 0.22)',
  fillColor = 'rgb(63 107 50 / 0.03)',
  shadowColor = 'rgb(63 107 50 / 0.14)',
  className,
  interactive = true,
}: BackgroundRippleEffectProps) {
  const [clickedCell, setClickedCell] = useState<{ row: number; col: number } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className={cn('absolute inset-0 h-full w-full overflow-hidden', className)}
      style={
        {
          '--cell-border-color': borderColor,
          '--cell-fill-color': fillColor,
          '--cell-shadow-color': shadowColor,
        } as React.CSSProperties
      }
    >
      <DivGrid
        key={`base-${rippleKey}`}
        className="mask-radial-from-10% mask-radial-at-center opacity-95"
        rows={rows}
        cols={cols}
        cellSize={cellSize}
        borderColor="var(--cell-border-color)"
        fillColor="var(--cell-fill-color)"
        clickedCell={clickedCell}
        onCellClick={(row, col) => {
          setClickedCell({ row, col });
          setRippleKey(k => k + 1);
        }}
        interactive={interactive}
      />
    </div>
  );
}

type DivGridProps = {
  className?: string;
  rows: number;
  cols: number;
  cellSize: number;
  borderColor: string;
  fillColor: string;
  clickedCell: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
};

type CellStyle = React.CSSProperties & {
  ['--delay']?: string;
  ['--duration']?: string;
};

function DivGrid({
  className,
  rows = 7,
  cols = 30,
  cellSize = 56,
  borderColor = '#3f3f46',
  fillColor = 'rgba(14,165,233,0.3)',
  clickedCell = null,
  onCellClick = () => {},
  interactive = true,
}: DivGridProps) {
  const cells = useMemo(() => Array.from({ length: rows * cols }, (_, idx) => idx), [rows, cols]);

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: rows * cellSize,
    marginInline: 'auto',
  };

  return (
    <div className={cn('relative', className)} style={gridStyle}>
      {cells.map(idx => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const delay = clickedCell ? Math.max(0, distance * 55) : 0;
        const duration = 200 + distance * 80;

        const style: CellStyle = clickedCell
          ? {
              '--delay': `${delay}ms`,
              '--duration': `${duration}ms`,
            }
          : {};

        return (
          <div
            key={idx}
            className={cn(
              'cell relative border-[0.5px] opacity-[0.58] transition-opacity duration-150 will-change-transform hover:opacity-90 hover:shadow-[inset_0_0_20px_1px_var(--cell-shadow-color)]',
              clickedCell && 'animate-cell-ripple [animation-fill-mode:none]',
              !interactive && 'pointer-events-none'
            )}
            style={{
              backgroundColor: fillColor,
              borderColor: borderColor,
              ...style,
            }}
            onClick={interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined}
          />
        );
      })}
    </div>
  );
}
