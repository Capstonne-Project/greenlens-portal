'use client';

import { Check } from 'lucide-react';
import { Fragment } from 'react';

export interface OfficeOnboardingStep {
  id: number;
  title: string;
  desc: string;
}

interface OfficeOnboardingStepperProps {
  steps: readonly OfficeOnboardingStep[];
  currentStep: number;
  /** Số bước đã hoàn tất (đoạn nối 1→2 xong khi >= 1, v.v.) */
  completedThrough: number;
}

function StepConnector({
  segmentStep,
  completedThrough,
  currentStep,
}: {
  segmentStep: number;
  completedThrough: number;
  currentStep: number;
}) {
  const isComplete = completedThrough >= segmentStep;
  const isActive = !isComplete && currentStep === segmentStep;

  return (
    <div
      className="relative mt-4 h-0.5 min-w-8 flex-1 overflow-hidden rounded-full bg-muted"
      aria-hidden
    >
      {isComplete ? <span className="absolute inset-0 rounded-full bg-emerald-600" /> : null}
      {isActive ? (
        <span className="absolute inset-0 overflow-hidden rounded-full">
          <span className="stepper-line-shuttle absolute inset-y-0 left-0 w-2/5 rounded-full bg-emerald-600" />
        </span>
      ) : null}
    </div>
  );
}

export function OfficeOnboardingStepper({
  steps,
  currentStep,
  completedThrough,
}: OfficeOnboardingStepperProps) {
  return (
    <div className="mb-5 px-1">
      <ol className="flex items-start">
        {steps.map((s, index) => {
          const done = s.id <= completedThrough;
          const active = s.id === currentStep;

          return (
            <Fragment key={s.id}>
              <li className="flex w-24 shrink-0 flex-col items-center gap-2 text-center sm:w-28">
                <span
                  className={`relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    done
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : active
                        ? 'border-emerald-600 bg-background text-emerald-800'
                        : 'border-muted bg-background text-muted-foreground'
                  }`}
                >
                  {done ? <Check className="size-4" /> : s.id}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      active
                        ? 'text-emerald-900'
                        : done
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">
                    {s.desc}
                  </p>
                </div>
              </li>
              {index < steps.length - 1 ? (
                <StepConnector
                  segmentStep={s.id}
                  completedThrough={completedThrough}
                  currentStep={currentStep}
                />
              ) : null}
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
