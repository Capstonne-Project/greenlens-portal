'use client';

import { useEffect, useState } from 'react';
import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect';

const CELL_SIZE = 56;
/** Cap DOM nodes — ~30×30 max for Lighthouse / mobile. */
const MAX_CELLS = 900;

function gridForViewport(width: number, height: number): { rows: number; cols: number } {
  let cols = Math.ceil(width / CELL_SIZE) + 2;
  let rows = Math.ceil(height / CELL_SIZE) + 2;
  const total = cols * rows;
  if (total > MAX_CELLS) {
    const scale = Math.sqrt(total / MAX_CELLS);
    cols = Math.max(14, Math.ceil(cols / scale));
    rows = Math.max(12, Math.ceil(rows / scale));
  }
  return { rows, cols };
}

/**
 * Fixed full-viewport landing canvas: white-first + subtle GreenLens cells.
 * Click empty areas (gaps) to ripple; content uses `landing-hit` / pointer-events-auto.
 */
export function LandingAtmosphere() {
  const [grid, setGrid] = useState({ rows: 18, cols: 24 });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReduceMotion(mq.matches);
    syncMotion();
    mq.addEventListener('change', syncMotion);

    const update = () => setGrid(gridForViewport(window.innerWidth, window.innerHeight));
    update();
    window.addEventListener('resize', update);

    return () => {
      mq.removeEventListener('change', syncMotion);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className="landing-atmosphere" aria-hidden>
      <BackgroundRippleEffect
        rows={grid.rows}
        cols={grid.cols}
        cellSize={CELL_SIZE}
        interactive={!reduceMotion}
        borderColor="rgb(63 107 50 / 0.22)"
        fillColor="rgb(63 107 50 / 0.03)"
        shadowColor="rgb(63 107 50 / 0.14)"
        className="landing-atmosphere-ripple z-[1]"
      />
    </div>
  );
}
