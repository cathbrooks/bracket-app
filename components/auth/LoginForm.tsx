'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { signIn } from '@/lib/auth/client';
import { ROUTES } from '@/lib/constants';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginFormData) {
    setServerError(null);

    const { error } = await signIn(data.email, data.password);

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push(ROUTES.organizer.dashboard);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <FormItem>
        <FormLabel htmlFor="email" error={!!errors.email}>
          Email
        </FormLabel>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register('email')}
        />
        <FormMessage>{errors.email?.message}</FormMessage>
      </FormItem>

      <FormItem>
        <FormLabel htmlFor="password" error={!!errors.password}>
          Password
        </FormLabel>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          {...register('password')}
        />
        <FormMessage>{errors.password?.message}</FormMessage>
      </FormItem>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Sign In
      </Button>
    </form>
  );
}
