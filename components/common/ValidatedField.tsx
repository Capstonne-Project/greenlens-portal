'use client';

import { cn } from '@/lib/utils';
import {
  formatTextLimitCounter,
  getTextCount,
  getTextLimitStatus,
  textLimitHint,
  type TextCountMode,
} from '@/utils/textFieldLimits';
import { forwardRef, type ComponentProps, type ReactNode } from 'react';

const fieldBaseClass =
  'w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60';

type ValidatedFieldBaseProps = {
  value?: string;
  minLength?: number;
  maxLength: number;
  countMode?: TextCountMode;
  /** Textarea: hiển thị thêm số từ bên cạnh bộ đếm ký tự. */
  showWordCount?: boolean;
  /** Toolbar/filter — ẩn footer đếm ký tự để căn hàng với select/button. */
  showCounter?: boolean;
  error?: string;
  hint?: ReactNode;
  className?: string;
  counterClassName?: string;
};

function useLiveTextValidation(
  value: string,
  opts: {
    minLength?: number;
    maxLength: number;
    countMode?: TextCountMode;
    error?: string;
  }
) {
  const { minLength = 0, maxLength, countMode = 'chars', error } = opts;
  const status = getTextLimitStatus(value, { min: minLength, max: maxLength, mode: countMode });
  const isEmpty = getTextCount(value, countMode) === 0;

  /**
   * Enterprise UX: ô trống chưa nhập = pristine.
   * Không báo minLength / viền đỏ cho đến khi user đã gõ (hoặc form truyền `error` sau submit).
   */
  const enforceLiveLimits = !isEmpty || Boolean(error);
  const liveHint = enforceLiveLimits
    ? textLimitHint(value, { min: minLength, max: maxLength, mode: countMode })
    : null;
  const message = error ?? liveHint;
  const invalid = Boolean(error) || (enforceLiveLimits && status !== 'ok');

  return { status, message, invalid };
}

function FieldFooter({
  message,
  invalid,
  counter,
  hint,
  counterClassName,
}: {
  message?: string | null;
  invalid: boolean;
  counter: string;
  hint?: ReactNode;
  counterClassName?: string;
}) {
  return (
    <div className="space-y-1">
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex items-start justify-between gap-2">
        {message ? (
          <p className="text-xs text-destructive" role="alert">
            {message}
          </p>
        ) : (
          <span className="min-h-[1rem]" aria-hidden />
        )}
        <p
          className={cn(
            'shrink-0 text-xs tabular-nums',
            invalid ? 'font-medium text-destructive' : 'text-muted-foreground',
            counterClassName
          )}
          aria-live="polite"
        >
          {counter}
        </p>
      </div>
    </div>
  );
}

export type ValidatedInputProps = Omit<ComponentProps<'input'>, 'minLength' | 'maxLength'> &
  ValidatedFieldBaseProps;

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  function ValidatedInput(
    {
      value = '',
      minLength = 0,
      maxLength,
      countMode = 'chars',
      showWordCount = false,
      showCounter = true,
      error,
      hint,
      className,
      counterClassName,
      disabled,
      ...props
    },
    ref
  ) {
    const { message, invalid } = useLiveTextValidation(String(value), {
      minLength,
      maxLength,
      countMode,
      error,
    });

    const counter = formatTextLimitCounter(String(value), {
      min: minLength,
      max: maxLength,
      mode: countMode,
      showWords: showWordCount,
    });

    return (
      <div className={cn(showCounter && 'space-y-1')}>
        <input
          ref={ref}
          disabled={disabled}
          maxLength={countMode === 'chars' ? maxLength : undefined}
          aria-invalid={invalid || undefined}
          className={cn(
            fieldBaseClass,
            'h-11',
            invalid && 'border-destructive focus-visible:ring-destructive/30',
            className
          )}
          {...props}
        />
        {showCounter ? (
          <FieldFooter
            message={message}
            invalid={invalid}
            counter={counter}
            hint={hint}
            counterClassName={counterClassName}
          />
        ) : null}
      </div>
    );
  }
);

export type ValidatedTextareaProps = Omit<ComponentProps<'textarea'>, 'minLength' | 'maxLength'> &
  ValidatedFieldBaseProps;

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  function ValidatedTextarea(
    {
      value = '',
      minLength = 0,
      maxLength,
      countMode = 'chars',
      showWordCount = true,
      error,
      hint,
      className,
      counterClassName,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) {
    const { message, invalid } = useLiveTextValidation(String(value), {
      minLength,
      maxLength,
      countMode,
      error,
    });

    const counter = formatTextLimitCounter(String(value), {
      min: minLength,
      max: maxLength,
      mode: countMode,
      showWords: showWordCount,
    });

    return (
      <div className="space-y-1">
        <textarea
          ref={ref}
          disabled={disabled}
          rows={rows}
          maxLength={countMode === 'chars' ? maxLength : undefined}
          aria-invalid={invalid || undefined}
          className={cn(
            fieldBaseClass,
            'resize-y py-2',
            invalid && 'border-destructive focus-visible:ring-destructive/30',
            className
          )}
          {...props}
        />
        <FieldFooter
          message={message}
          invalid={invalid}
          counter={counter}
          hint={hint}
          counterClassName={counterClassName}
        />
      </div>
    );
  }
);

/** Ô tìm kiếm — chỉ giới hạn max, không bắt min. */
export type ValidatedSearchInputProps = Omit<ValidatedInputProps, 'minLength' | 'countMode'>;

export const ValidatedSearchInput = forwardRef<HTMLInputElement, ValidatedSearchInputProps>(
  function ValidatedSearchInput(props, ref) {
    return <ValidatedInput ref={ref} minLength={0} countMode="chars" type="search" {...props} />;
  }
);

export type ValidatedNumberInputProps = Omit<ComponentProps<'input'>, 'type' | 'min' | 'max'> & {
  value?: number | string;
  min?: number;
  max?: number;
  error?: string;
  hint?: ReactNode;
  unit?: string;
  className?: string;
};

export const ValidatedNumberInput = forwardRef<HTMLInputElement, ValidatedNumberInputProps>(
  function ValidatedNumberInput(
    { value, min, max, error, hint, unit, className, disabled, ...props },
    ref
  ) {
    const num = value === '' || value == null ? NaN : Number(value);
    const tooLow = min != null && !Number.isNaN(num) && num < min;
    const tooHigh = max != null && !Number.isNaN(num) && num > max;
    const invalid = Boolean(error) || tooLow || tooHigh;

    let liveHint: string | null = null;
    if (!error && !Number.isNaN(num)) {
      if (tooLow && min != null) liveHint = `Giá trị tối thiểu là ${min}`;
      if (tooHigh && max != null) liveHint = `Giá trị tối đa là ${max}`;
    }

    const counter =
      min != null && max != null
        ? `${Number.isNaN(num) ? '—' : num} (${min}–${max}${unit ? ` ${unit}` : ''})`
        : max != null
          ? `${Number.isNaN(num) ? '—' : num}/${max}${unit ? ` ${unit}` : ''}`
          : null;

    return (
      <div className="space-y-1">
        <input
          ref={ref}
          type="number"
          disabled={disabled}
          min={min}
          max={max}
          aria-invalid={invalid || undefined}
          className={cn(
            fieldBaseClass,
            'h-11',
            invalid && 'border-destructive focus-visible:ring-destructive/30',
            className
          )}
          {...props}
        />
        <FieldFooter
          message={error ?? liveHint}
          invalid={invalid}
          counter={counter ?? ''}
          hint={hint}
        />
      </div>
    );
  }
);
