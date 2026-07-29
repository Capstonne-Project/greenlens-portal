'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type LoginFormMotionProps = {
  children: ReactNode;
  className?: string;
};

/** Fade-in nhẹ — không parallax / float (tránh cảm giác template AI). */
export function LoginFormMotion({ children, className }: LoginFormMotionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
