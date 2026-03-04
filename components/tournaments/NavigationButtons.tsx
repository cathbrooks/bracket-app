'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isNextDisabled?: boolean;
  isSubmitting?: boolean;
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isNextDisabled = false,
  isSubmitting = false,
}: NavigationButtonsProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center justify-between pt-6 border-t border-border">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={isFirstStep}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {isLastStep ? (
        <Button
          type="button"
          onClick={onSubmit}
          loading={isSubmitting}
          disabled={isNextDisabled}
        >
          Create Tournament
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
