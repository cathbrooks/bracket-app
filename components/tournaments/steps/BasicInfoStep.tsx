'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { basicInfoSchema, type BasicInfoFormData } from '@/lib/schemas/tournament.schema';
import {
  MIN_TOURNAMENT_NAME_LENGTH,
  MAX_TOURNAMENT_NAME_LENGTH,
  MAX_GAME_TYPE_LENGTH,
} from '@/lib/constants';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Users, User } from 'lucide-react';

interface BasicInfoStepProps {
  values: BasicInfoFormData;
  onChange: (data: BasicInfoFormData) => void;
  onValidChange: (valid: boolean) => void;
}

export function BasicInfoStep({ values, onChange, onValidChange }: BasicInfoStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: { ...values, participantType: values.participantType ?? 'teams' },
    mode: 'onChange',
  });

  const watched = watch();

  useEffect(() => {
    onValidChange(isValid);
  }, [isValid, onValidChange]);

  useEffect(() => {
    if (
      watched.name !== values.name ||
      watched.gameType !== values.gameType ||
      watched.participantType !== values.participantType
    ) {
      onChange(watched);
    }
  }, [watched.name, watched.gameType, watched.participantType, onChange, values]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <p className="text-sm text-muted-foreground">
          Name your tournament and specify the game being played.
        </p>
      </div>

      <FormItem>
        <FormLabel htmlFor="name" error={!!errors.name}>
          Tournament Name
        </FormLabel>
        <Input
          id="name"
          placeholder="e.g., Friday Night Smash"
          {...register('name')}
        />
        <div className="flex items-center justify-between">
          <FormMessage>{errors.name?.message}</FormMessage>
          <FormDescription>
            {watched.name?.length ?? 0}/{MAX_TOURNAMENT_NAME_LENGTH}
          </FormDescription>
        </div>
        <FormDescription>
          Min {MIN_TOURNAMENT_NAME_LENGTH} characters
        </FormDescription>
      </FormItem>

      <FormItem>
        <FormLabel error={!!errors.participantType}>
          Will this tournament have teams or individual players?
        </FormLabel>
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[
            { value: 'teams' as const, label: 'Teams', icon: Users },
            { value: 'players' as const, label: 'Players', icon: User },
          ].map(({ value, label, icon: Icon }) => {
            const isSelected = watched.participantType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setValue('participantType', value, { shouldValidate: true })}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border-2 py-3 transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </div>
        <FormMessage>{errors.participantType?.message}</FormMessage>
      </FormItem>

      <FormItem>
        <FormLabel htmlFor="gameType" error={!!errors.gameType}>
          Game
        </FormLabel>
        <Input
          id="gameType"
          placeholder="e.g., Super Smash Bros. Ultimate"
          {...register('gameType')}
        />
        <div className="flex items-center justify-between">
          <FormMessage>{errors.gameType?.message}</FormMessage>
          <FormDescription>
            {watched.gameType?.length ?? 0}/{MAX_GAME_TYPE_LENGTH}
          </FormDescription>
        </div>
      </FormItem>
    </div>
  );
}
