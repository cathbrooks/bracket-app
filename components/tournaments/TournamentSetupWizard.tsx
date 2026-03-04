'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { StepIndicator } from './StepIndicator';
import { NavigationButtons } from './NavigationButtons';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { FormatSelectionStep } from './steps/FormatSelectionStep';
import { TeamConfigurationStep } from './steps/TeamConfigurationStep';
import { TimingConfigurationStep } from './steps/TimingConfigurationStep';
import { ReviewStep } from './steps/ReviewStep';
import type { TournamentFormat } from '@/lib/constants';

const TOTAL_STEPS = 5;

interface WizardConfig {
  name: string;
  gameType: string;
  format: TournamentFormat;
  grandFinalsReset: boolean;
  teamCount: number;
  teamNames: string[];
  stationCount: number;
  matchDurationMinutes: number;
  bufferTimeMinutes: number;
  seedingMode: 'manual' | 'time-trial';
}

const INITIAL_CONFIG: WizardConfig = {
  name: '',
  gameType: '',
  format: 'single-elimination',
  grandFinalsReset: true,
  teamCount: 8,
  teamNames: Array(8).fill(''),
  stationCount: 1,
  matchDurationMinutes: 10,
  bufferTimeMinutes: 2,
  seedingMode: 'manual',
};

export function TournamentSetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<WizardConfig>(INITIAL_CONFIG);
  const [stepValid, setStepValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleValidChange = useCallback((valid: boolean) => {
    setStepValid(valid);
  }, []);

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setStepValid(true);
    }
  }

  function handleNext() {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
      if (currentStep + 1 === TOTAL_STEPS - 1) {
        setStepValid(true);
      }
    }
  }

  function handleEditStep(step: number) {
    setCurrentStep(step);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const timePerMatch = config.matchDurationMinutes + config.bufferTimeMinutes;

      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          gameType: config.gameType,
          format: config.format,
          teamCount: config.teamCount,
          stationCount: config.stationCount,
          timePerMatchMinutes: timePerMatch > 0 ? timePerMatch : undefined,
          seedingMode: config.seedingMode,
          teamNames: config.teamNames,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? 'Failed to create tournament');
      }

      const tournamentId = json.data.tournament.id;
      router.push(`/organizer/tournament/${tournamentId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator currentStep={currentStep} />

      <Card>
        <CardContent className="p-6">
          {submitError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {currentStep === 0 && (
            <BasicInfoStep
              values={{ name: config.name, gameType: config.gameType }}
              onChange={(data) => setConfig((c) => ({ ...c, ...data }))}
              onValidChange={handleValidChange}
            />
          )}

          {currentStep === 1 && (
            <FormatSelectionStep
              values={{
                format: config.format,
                grandFinalsReset: config.grandFinalsReset,
              }}
              onChange={(data) =>
                setConfig((c) => ({
                  ...c,
                  format: data.format,
                  grandFinalsReset: data.grandFinalsReset ?? true,
                }))
              }
              onValidChange={handleValidChange}
            />
          )}

          {currentStep === 2 && (
            <TeamConfigurationStep
              values={{
                teamCount: config.teamCount,
                teamNames: config.teamNames,
                seedingMode: config.seedingMode,
              }}
              onChange={(data) =>
                setConfig((c) => ({
                  ...c,
                  teamCount: data.teamCount,
                  teamNames: data.teamNames,
                  seedingMode: data.seedingMode,
                }))
              }
              onValidChange={handleValidChange}
            />
          )}

          {currentStep === 3 && (
            <TimingConfigurationStep
              values={{
                stationCount: config.stationCount,
                matchDurationMinutes: config.matchDurationMinutes,
                bufferTimeMinutes: config.bufferTimeMinutes,
                teamCount: config.teamCount,
              }}
              onChange={(data) =>
                setConfig((c) => ({
                  ...c,
                  stationCount: data.stationCount,
                  matchDurationMinutes: data.matchDurationMinutes,
                  bufferTimeMinutes: data.bufferTimeMinutes,
                }))
              }
              onValidChange={handleValidChange}
            />
          )}

          {currentStep === 4 && (
            <ReviewStep
              config={config}
              onEditStep={handleEditStep}
            />
          )}

          <NavigationButtons
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onBack={handleBack}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isNextDisabled={!stepValid}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
