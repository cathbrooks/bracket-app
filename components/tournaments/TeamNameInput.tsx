'use client';

import { Input } from '@/components/ui/input';
import { MAX_TEAM_NAME_LENGTH } from '@/lib/constants';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamNameInputProps {
  index: number;
  value: string;
  onChange: (value: string) => void;
  isDuplicate?: boolean;
  error?: string;
}

export function TeamNameInput({
  index,
  value,
  onChange,
  isDuplicate = false,
  error,
}: TeamNameInputProps) {
  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          placeholder={`Team ${index + 1}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={MAX_TEAM_NAME_LENGTH}
          className={cn(
            isDuplicate && 'border-yellow-500 focus-visible:ring-yellow-500',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
        />
        {isDuplicate && (
          <AlertTriangle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yellow-500" />
        )}
      </div>
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : isDuplicate ? (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">Duplicate name</p>
        ) : (
          <span />
        )}
        <p className="text-xs text-muted-foreground">
          {value.length}/{MAX_TEAM_NAME_LENGTH}
        </p>
      </div>
    </div>
  );
}
