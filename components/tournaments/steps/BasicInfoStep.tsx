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

interface BasicInfoStepProps {
  values: BasicInfoFormData;
  onChange: (data: BasicInfoFormData) => void;
  onValidChange: (valid: boolean) => void;
}

export function BasicInfoStep({ values, onChange, onValidChange }: BasicInfoStepProps) {
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: values,
    mode: 'onChange',
  });

  const watched = watch();

  useEffect(() => {
    onValidChange(isValid);
  }, [isValid, onValidChange]);

  useEffect(() => {
    if (watched.name !== values.name || watched.gameType !== values.gameType) {
      onChange(watched);
    }
  }, [watched.name, watched.gameType, onChange, values.name, values.gameType]);

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
