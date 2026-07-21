'use client';

import { cn } from '@/lib/utils';
import { motion, stagger, useAnimate, useInView } from 'motion/react';
import { useEffect, useState } from 'react';

type TypewriterWord = {
  text: string;
  className?: string;
};

export function TypewriterEffect({
  words,
  className,
  cursorClassName,
}: {
  words: TypewriterWord[];
  className?: string;
  cursorClassName?: string;
}) {
  const wordsArray = words.map(word => ({
    ...word,
    text: word.text.split(''),
  }));

  const [scope, animate] = useAnimate();
  const isInView = useInView(scope);
  useEffect(() => {
    if (isInView) {
      animate(
        'span',
        {
          display: 'inline-block',
          opacity: 1,
          width: 'fit-content',
        },
        {
          duration: 0.3,
          delay: stagger(0.1),
          ease: 'easeInOut',
        }
      );
    }
  }, [isInView, animate]);

  const renderWords = () => (
    <motion.div ref={scope} className="inline">
      {wordsArray.map((word, idx) => (
        <div key={`word-${idx}`} className="inline-block">
          {word.text.map((char, index) => (
            <motion.span
              initial={{}}
              key={`char-${index}`}
              className={cn('hidden text-black opacity-0 dark:text-white', word.className)}
            >
              {char}
            </motion.span>
          ))}
          &nbsp;
        </div>
      ))}
    </motion.div>
  );

  return (
    <div
      className={cn(
        'text-center text-base font-bold sm:text-xl md:text-3xl lg:text-5xl',
        className
      )}
    >
      {renderWords()}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        className={cn(
          'inline-block h-4 w-[4px] rounded-sm bg-blue-500 md:h-6 lg:h-10',
          cursorClassName
        )}
      />
    </div>
  );
}

const DEFAULT_DURATION = 2;
const DEFAULT_DELAY = 0.2;

export function TypewriterEffectSmooth({
  words,
  className,
  cursorClassName,
  textClassName,
  duration = DEFAULT_DURATION,
  delay = DEFAULT_DELAY,
  /** When true, blinking caret hides after the reveal finishes. */
  hideCursorOnComplete = true,
}: {
  words: TypewriterWord[];
  className?: string;
  cursorClassName?: string;
  textClassName?: string;
  duration?: number;
  delay?: number;
  hideCursorOnComplete?: boolean;
}) {
  const wordsKey = words.map(w => w.text).join('|');
  const [trackedKey, setTrackedKey] = useState(wordsKey);
  const [showCursor, setShowCursor] = useState(true);
  const wordsArray = words.map(word => ({
    ...word,
    text: word.text.split(''),
  }));

  // Reset cursor when copy changes — during render (React-approved), not in effect.
  if (trackedKey !== wordsKey) {
    setTrackedKey(wordsKey);
    setShowCursor(true);
  }

  useEffect(() => {
    if (!hideCursorOnComplete) return undefined;

    const ms = (delay + duration) * 1000 + 80;
    const timer = setTimeout(() => setShowCursor(false), ms);
    return () => clearTimeout(timer);
  }, [hideCursorOnComplete, delay, duration, wordsKey]);

  const renderWords = () => (
    <div>
      {wordsArray.map((word, idx) => (
        <div key={`word-${idx}`} className="inline-block">
          {word.text.map((char, index) => (
            <span
              key={`char-${index}`}
              className={cn('text-black dark:text-white', word.className)}
            >
              {char}
            </span>
          ))}
          {idx < wordsArray.length - 1 ? <span>&nbsp;</span> : null}
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn('my-6 flex items-center space-x-1', className)}>
      <motion.div
        className="overflow-hidden pb-0.5"
        initial={{ width: '0%' }}
        whileInView={{ width: 'fit-content' }}
        viewport={{ once: true }}
        transition={{
          duration,
          ease: 'linear',
          delay,
        }}
      >
        <div
          className={cn(
            'text-xs font-bold whitespace-nowrap sm:text-base md:text-xl lg:text-3xl xl:text-5xl',
            textClassName
          )}
        >
          {renderWords()}
        </div>
      </motion.div>
      {showCursor ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className={cn(
            'block h-4 w-[4px] shrink-0 rounded-sm bg-blue-500 sm:h-6 xl:h-12',
            cursorClassName
          )}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
