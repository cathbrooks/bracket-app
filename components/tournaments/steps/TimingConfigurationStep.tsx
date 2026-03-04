'use client';

import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { Info } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

interface TimingConfigData {
  stationCount: number;
  matchDurationMinutes: number;
  bufferTimeMinutes: number;
  teamCount: number;
}

interface TimingConfigurationStepProps {
  values: TimingConfigData;
  onChange: (data: TimingConfigData) => void;
  onValidChange: (valid: boolean) => void;
}

export function TimingConfigurationStep({ values, onChange, onValidChange }: TimingConfigurationStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((data: TimingConfigData) => {
    const newErrors: Record<string, string> = {};

    if (data.matchDurationMinutes < 1) {
      newErrors.matchDuration = 'Minimum 1 minute';
    } else if (data.matchDurationMinutes > 180) {
      newErrors.matchDuration = 'Maximum 180 minutes';
    }

    if (data.bufferTimeMinutes < 0) {
      newErrors.bufferTime = 'Cannot be negative';
    } else if (data.bufferTimeMinutes > 60) {
      newErrors.bufferTime = 'Maximum 60 minutes';
    }

    if (data.stationCount < 1) {
      newErrors.stationCount = 'At least 1 station required';
    } else if (data.stationCount > 16) {
      newErrors.stationCount = 'Maximum 16 stations';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  useEffect(() => {
    onValidChange(validate(values));
  }, [values, onValidChange, validate]);

  const maxUsefulStations = Math.floor(values.teamCount / 2);
  const showStationWarning = values.stationCount > maxUsefulStations && maxUsefulStations > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Timing & Stations</h2>
        <p className="text-sm text-muted-foreground">
          Configure match timing and available stations for accurate duration estimates.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Timing Tips</p>
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              <li>Typical match: 10-15 minutes</li>
              <li>Buffer time: 2-5 minutes (for setup between matches)</li>
              <li>More stations = more parallel matches = shorter tournament</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormItem>
          <FormLabel htmlFor="matchDuration" error={!!errors.matchDuration}>
            Match Duration (minutes)
          </FormLabel>
          <Input
            id="matchDuration"
            type="number"
            min={1}
            max={180}
            value={values.matchDurationMinutes || ''}
            onChange={(e) =>
              onChange({ ...values, matchDurationMinutes: parseInt(e.target.value, 10) || 0 })
            }
          />
          <FormMessage>{errors.matchDuration}</FormMessage>
          <FormDescription>1 to 180 minutes per match</FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel htmlFor="bufferTime" error={!!errors.bufferTime}>
            Buffer Time (minutes)
          </FormLabel>
          <Input
            id="bufferTime"
            type="number"
            min={0}
            max={60}
            value={values.bufferTimeMinutes ?? ''}
            onChange={(e) =>
              onChange({ ...values, bufferTimeMinutes: parseInt(e.target.value, 10) || 0 })
            }
          />
          <FormMessage>{errors.bufferTime}</FormMessage>
          <FormDescription>0 to 60 minutes between matches</FormDescription>
        </FormItem>
      </div>

      <FormItem>
        <FormLabel htmlFor="stationCount" error={!!errors.stationCount}>
          Number of Stations
        </FormLabel>
        <Input
          id="stationCount"
          type="number"
          min={1}
          max={16}
          value={values.stationCount || ''}
          onChange={(e) =>
            onChange({ ...values, stationCount: parseInt(e.target.value, 10) || 1 })
          }
        />
        <FormMessage>{errors.stationCount}</FormMessage>
        <FormDescription>
          How many game setups can run matches simultaneously
        </FormDescription>
      </FormItem>

      {showStationWarning && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Maximum useful stations for {values.teamCount} participants is {maxUsefulStations} (half the count for the first round). Extra stations won&apos;t reduce tournament duration.
          </p>
        </div>
      )}
    </div>
  );
}
