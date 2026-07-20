'use client';

import {
  useState,
  useRef,
  useEffect,
  useId,
  useMemo,
  useCallback,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

function GooeyFilter({ filterId, blur }: { filterId: string; blur: number }) {
  return (
    <svg className="absolute hidden h-0 w-0" aria-hidden>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

function SearchIcon({ layoutId }: { layoutId: string }) {
  return (
    <motion.svg
      layoutId={layoutId}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      className="size-3.5 shrink-0 text-slate-400"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </motion.svg>
  );
}

const transition = {
  duration: 0.4,
  type: 'spring' as const,
  bounce: 0.25,
};

const iconBubbleVariants = {
  collapsed: { scale: 0, opacity: 0 },
  expanded: { scale: 1, opacity: 1 },
};

/** Surface khớp input search officer cũ: h-8, bg trắng, border slate. */
const surfaceClass = 'border border-slate-200 bg-white text-slate-800 shadow-none ring-0';

export interface GooeyInputClassNames {
  root?: string;
  filterWrap?: string;
  buttonRow?: string;
  trigger?: string;
  input?: string;
  bubble?: string;
  bubbleSurface?: string;
}

export interface GooeyInputProps {
  placeholder?: string;
  className?: string;
  classNames?: GooeyInputClassNames;
  /** Collapsed control width in px */
  collapsedWidth?: number;
  /** Expanded control width in px */
  expandedWidth?: number;
  /** Horizontal offset when expanded (px), aligns detached bubble */
  expandedOffset?: number;
  /** Gaussian blur amount for the gooey SVG filter */
  gooeyBlur?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** Nội dung sát phải trong field (ngoài gooey filter để không bị blur). */
  endAdornment?: ReactNode;
}

export function GooeyInput({
  placeholder = 'Type to search...',
  className,
  classNames,
  collapsedWidth = 160,
  expandedWidth = 280,
  expandedOffset = 36,
  gooeyBlur = 5,
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onOpenChange,
  disabled = false,
  endAdornment,
}: GooeyInputProps) {
  const reactId = useId();
  const safeId = reactId.replace(/:/g, '');
  const filterId = `gooey-filter-${safeId}`;
  const iconLayoutId = `gooey-input-icon-${safeId}`;
  const inputLayoutId = `gooey-input-field-${safeId}`;

  const inputRef = useRef<HTMLInputElement>(null);
  const prevExpandedRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const isControlled = valueProp !== undefined;
  const searchText = isControlled ? valueProp : uncontrolledValue;

  const setSearchText = useCallback(
    (next: string) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  const setExpanded = useCallback(
    (next: boolean) => {
      setIsExpanded(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    } else if (prevExpandedRef.current) {
      setSearchText('');
    }
    prevExpandedRef.current = isExpanded;
  }, [isExpanded, setSearchText]);

  const buttonVariants = useMemo(
    () => ({
      collapsed: { width: collapsedWidth, marginLeft: 0 },
      expanded: { width: expandedWidth, marginLeft: expandedOffset },
    }),
    [collapsedWidth, expandedWidth, expandedOffset]
  );

  const handleExpand = useCallback(() => {
    if (!disabled) setExpanded(true);
  }, [disabled, setExpanded]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [setSearchText]
  );

  const handleBlur = useCallback(() => {
    if (!searchText) setExpanded(false);
  }, [searchText, setExpanded]);

  return (
    <div className={cn('relative flex items-center justify-center', className, classNames?.root)}>
      <GooeyFilter filterId={filterId} blur={gooeyBlur} />

      <div className="relative">
        <div
          className={cn('relative flex h-8 items-center justify-center', classNames?.filterWrap)}
          style={{ filter: `url(#${filterId})` }}
        >
          <motion.div
            className={cn('flex h-8 items-center justify-center', classNames?.buttonRow)}
            variants={buttonVariants}
            initial="collapsed"
            animate={isExpanded ? 'expanded' : 'collapsed'}
            transition={transition}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={handleExpand}
              className={cn(
                'flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm font-normal outline-none transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
                endAdornment ? 'pr-8' : null,
                surfaceClass,
                classNames?.trigger
              )}
            >
              {!isExpanded ? <SearchIcon layoutId={iconLayoutId} /> : null}
              <motion.input
                layoutId={inputLayoutId}
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                value={searchText}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={disabled || !isExpanded}
                placeholder={placeholder}
                className={cn(
                  'h-full min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none',
                  isExpanded
                    ? 'placeholder:text-slate-400'
                    : 'pointer-events-none placeholder:text-slate-400',
                  classNames?.input
                )}
              />
            </button>
          </motion.div>

          <motion.div
            className={cn(
              'absolute top-1/2 left-0 flex size-8 -translate-y-1/2 items-center justify-center',
              classNames?.bubble
            )}
            variants={iconBubbleVariants}
            initial="collapsed"
            animate={isExpanded ? 'expanded' : 'collapsed'}
            transition={transition}
          >
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-md',
                surfaceClass,
                classNames?.bubbleSurface
              )}
            >
              <SearchIcon layoutId={iconLayoutId} />
            </div>
          </motion.div>
        </div>

        {endAdornment ? (
          <div className="pointer-events-none absolute top-1/2 right-2 z-10 flex -translate-y-1/2 items-center">
            {endAdornment}
          </div>
        ) : null}
      </div>
    </div>
  );
}
