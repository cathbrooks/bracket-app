'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { isValidJoinCode } from '@/lib/utils/validation';

export default function JoinCodeEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a join code');
      return;
    }
    if (!isValidJoinCode(trimmed)) {
      setError('Invalid join code format. Codes are 6 alphanumeric characters.');
      return;
    }

    router.push(`/spectator/view/${trimmed}`);
  }

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Join Tournament</CardTitle>
          <CardDescription>
            Enter the join code shared by the tournament organizer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormItem>
              <FormLabel htmlFor="joinCode">Join Code</FormLabel>
              <Input
                id="joinCode"
                placeholder="e.g., A3KT7V"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="text-center text-lg font-mono tracking-widest"
                autoFocus
              />
              <FormMessage>{error}</FormMessage>
            </FormItem>
            <Button type="submit" className="w-full">
              View Bracket
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
