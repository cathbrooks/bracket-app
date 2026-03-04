'use client';

import { cn } from '@/lib/utils';
import { Trophy, Swords } from 'lucide-react';
import { useEffect } from 'react';

interface FormatSelectionData {
  format: 'single-elimination' | 'double-elimination';
  grandFinalsReset?: boolean;
}

interface FormatSelectionStepProps {
  values: FormatSelectionData;
  onChange: (data: FormatSelectionData) => void;
  onValidChange: (valid: boolean) => void;
}

const FORMAT_OPTIONS = [
  {
    value: 'single-elimination' as const,
    label: 'Single Elimination',
    description: 'One loss and you\'re out. Fast-paced and straightforward. Best for shorter events.',
    icon: Trophy,
  },
  {
    value: 'double-elimination' as const,
    label: 'Double Elimination',
    description: 'Teams must lose twice to be eliminated. More forgiving and competitive. Takes roughly twice as long.',
    icon: Swords,
  },
];

export function FormatSelectionStep({ values, onChange, onValidChange }: FormatSelectionStepProps) {
  useEffect(() => {
    onValidChange(!!values.format);
  }, [values.format, onValidChange]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Tournament Format</h2>
        <p className="text-sm text-muted-foreground">
          Choose how your bracket will be structured.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FORMAT_OPTIONS.map((option) => {
          const isSelected = values.format === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ ...values, format: option.value })}
              className={cn(
                'flex flex-col items-start gap-3 rounded-lg border-2 p-5 text-left transition-all hover:border-primary/50',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-semibold">{option.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      {values.format === 'double-elimination' && (
        <div className="rounded-lg border border-border p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium">Grand Finals Reset</p>
              <p className="text-sm text-muted-foreground">
                If the losers bracket winner beats the winners bracket champion, play an additional deciding set.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values.grandFinalsReset ?? true}
              onClick={() =>
                onChange({ ...values, grandFinalsReset: !(values.grandFinalsReset ?? true) })
              }
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
                (values.grandFinalsReset ?? true) ? 'bg-primary' : 'bg-input'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform',
                  (values.grandFinalsReset ?? true) ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </label>
        </div>
      )}
    </div>
  );
}
