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
import type { TournamentFormat, ParticipantType } from '@/lib/constants';

const TOTAL_STEPS = 5;

interface WizardConfig {
  name: string;
  gameType: string;
  participantType: ParticipantType;
  format: TournamentFormat;
  grandFinalsReset: boolean;
  teamCount: number;
  teamNames: string[];
  /** Whether team rosters are enabled (teams can have different sizes) */
  hasRosters: boolean;
  /** teamIndex → player names array (variable length per team) */
  teamRosters: string[][];
  stationCount: number;
  matchDurationMinutes: number;
  bufferTimeMinutes: number;
  seedingMode: 'manual' | 'time-trial';
}

const INITIAL_CONFIG: WizardConfig = {
  name: '',
  gameType: '',
  participantType: 'teams',
  format: 'single-elimination',
  grandFinalsReset: true,
  teamCount: 8,
  teamNames: Array(8).fill(''),
  hasRosters: false,
  teamRosters: Array(8).fill(null).map(() => []),
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
          participantType: config.participantType,
          format: config.format,
          teamCount: config.teamCount,
          stationCount: config.stationCount,
          timePerMatchMinutes: timePerMatch > 0 ? timePerMatch : undefined,
          seedingMode: config.seedingMode,
          teamNames: config.teamNames,
          teamRosters: config.hasRosters ? config.teamRosters : undefined,
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
      <StepIndicator currentStep={currentStep} participantType={config.participantType} />

      <Card>
        <CardContent className="p-6">
          {submitError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {currentStep === 0 && (
            <BasicInfoStep
              values={{
                name: config.name,
                gameType: config.gameType,
                participantType: config.participantType,
              }}
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
                participantType: config.participantType,
                teamCount: config.teamCount,
                teamNames: config.teamNames,
                seedingMode: config.seedingMode,
                hasRosters: config.hasRosters,
                teamRosters: config.teamRosters,
              }}
              onChange={(data) =>
                setConfig((c) => ({
                  ...c,
                  ...(data.teamCount !== undefined && { teamCount: data.teamCount }),
                  ...(data.teamNames !== undefined && { teamNames: data.teamNames }),
                  ...(data.seedingMode !== undefined && { seedingMode: data.seedingMode }),
                  ...(data.hasRosters !== undefined && { hasRosters: data.hasRosters }),
                  ...(data.teamRosters !== undefined && { teamRosters: data.teamRosters }),
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
