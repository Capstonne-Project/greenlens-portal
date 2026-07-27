'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayButton, DayPicker, type DayButtonProps } from 'react-day-picker';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Selected styles phải nằm trên button (không phải cell).
 * Nếu hover ở button mà selected ở cell → vừa click vẫn thấy hover đến khi bỏ chuột.
 */
function CalendarDayButton({ className, modifiers, ...props }: DayButtonProps) {
  const isSelected = Boolean(modifiers.selected);
  const isRangeMiddle = Boolean(modifiers.range_middle);
  const isRangeEdge = isSelected && !isRangeMiddle;

  return (
    <DayButton
      modifiers={modifiers}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-md p-0 text-sm font-normal transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Hover chỉ khi chưa select
        !isSelected && 'hover:bg-accent hover:text-accent-foreground',
        // Đầu/cuối range + single selected → primary ngay cả khi đang hover
        isRangeEdge &&
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
        // Giữa range → accent, không hover đổi màu
        isRangeMiddle &&
          'rounded-none bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground',
        className
      )}
      {...props}
    />
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'relative flex flex-col sm:flex-row gap-4',
        month: 'space-y-4',
        month_caption:
          'relative flex h-7 items-center justify-center px-8 pt-1 pointer-events-none',
        caption_label: 'text-sm font-medium',
        nav: 'absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-1 px-1',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'pointer-events-auto relative z-20 size-7 bg-background p-0 opacity-70 hover:opacity-100'
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'pointer-events-auto relative z-20 size-7 bg-background p-0 opacity-70 hover:opacity-100'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground flex size-9 items-center justify-center rounded-md font-normal text-[0.8rem]',
        week: 'mt-2 flex w-full',
        day: cn(
          'relative size-9 p-0 text-center text-sm focus-within:relative focus-within:z-20',
          // Thanh range phía sau button (đầu/cuối vẫn primary nhờ DayButton)
          '[&:has([aria-selected])]:bg-accent',
          '[&:has([aria-selected].day-range-start)]:rounded-l-md',
          '[&:has([aria-selected].day-range-end)]:rounded-r-md',
          '[&:has([aria-selected].day-outside)]:bg-accent/50',
          'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
        ),
        day_button: 'size-9 p-0 font-normal',
        range_start: 'day-range-start rounded-l-md',
        range_end: 'day-range-end rounded-r-md',
        selected: 'rounded-md',
        today:
          '[&:not(:has([aria-selected]))]:bg-accent [&:not(:has([aria-selected]))]:text-accent-foreground',
        outside: 'day-outside text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-50',
        range_middle: 'aria-selected:bg-accent rounded-none',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className={cn('size-4', chevronClassName)} {...chevronProps} />;
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
