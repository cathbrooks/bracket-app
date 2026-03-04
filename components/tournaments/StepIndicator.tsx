'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { ParticipantType } from '@/lib/constants';

const STEP_LABELS = ['Basic Info', 'Format', '', 'Timing', 'Review'] as const;

interface StepIndicatorProps {
  currentStep: number;
  participantType?: ParticipantType;
}

export function StepIndicator({ currentStep, participantType = 'teams' }: StepIndicatorProps) {
  const step2Label = participantType === 'players' ? 'Players' : 'Teams';
  const steps = STEP_LABELS.map((l, i) => (i === 2 ? step2Label : l));

  return (
    <nav aria-label="Tournament setup progress" className="mb-8">
      <ol className="flex items-center gap-2">
        {steps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <li key={index} className="flex flex-1 items-center">
              <div className="flex w-full flex-col items-center gap-1.5">
                <div className="flex w-full items-center">
                  {index > 0 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 transition-colors',
                        isCompleted ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                      isCompleted && 'bg-primary text-primary-foreground',
                      isCurrent && 'border-2 border-primary bg-background text-primary',
                      !isCompleted && !isCurrent && 'border border-border bg-background text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 transition-colors',
                        isCompleted ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium transition-colors',
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
