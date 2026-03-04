'use client';

import { TeamNameInput } from './TeamNameInput';
import { findDuplicateIndices } from '@/lib/utils/team-names';
import { AlertTriangle } from 'lucide-react';

interface TeamListProps {
  teamNames: string[];
  onChange: (names: string[]) => void;
}

export function TeamList({ teamNames, onChange }: TeamListProps) {
  const duplicateIndices = findDuplicateIndices(teamNames);
  const hasDuplicates = duplicateIndices.length > 0;

  function handleNameChange(index: number, name: string) {
    const updated = [...teamNames];
    updated[index] = name;
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Team Names ({teamNames.length} teams)
        </p>
        <p className="text-xs text-muted-foreground">
          Leave blank for default names
        </p>
      </div>

      {hasDuplicates && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Duplicate names detected. You can still proceed, but consider using unique names.
          </p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {teamNames.map((name, index) => (
          <TeamNameInput
            key={index}
            index={index}
            value={name}
            onChange={(val) => handleNameChange(index, val)}
            isDuplicate={duplicateIndices.includes(index)}
          />
        ))}
      </div>
    </div>
  );
}
