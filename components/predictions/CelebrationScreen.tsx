'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal } from 'lucide-react';

interface CelebrationScreenProps {
  tournamentName: string;
  winnerTeamName: string;
  predictionWinner?: {
    displayName: string;
    totalPoints: number;
    correctCount: number;
  } | null;
}

export function CelebrationScreen({
  tournamentName,
  winnerTeamName,
  predictionWinner,
}: CelebrationScreenProps) {
  return (
    <div className="space-y-6 py-8">
      <Card className="border-2 border-yellow-400 bg-gradient-to-b from-yellow-50 to-background dark:from-yellow-950/30">
        <CardContent className="py-8 text-center">
          <Trophy className="mx-auto h-16 w-16 text-yellow-500" />
          <h2 className="mt-4 text-2xl font-bold">Tournament Champion</h2>
          <p className="text-sm text-muted-foreground">{tournamentName}</p>
          <p className="mt-3 text-3xl font-extrabold text-primary">{winnerTeamName}</p>
        </CardContent>
      </Card>

      {predictionWinner && (
        <Card className="border-2 border-purple-400 bg-gradient-to-b from-purple-50 to-background dark:from-purple-950/30">
          <CardContent className="py-8 text-center">
            <Medal className="mx-auto h-12 w-12 text-purple-500" />
            <h2 className="mt-4 text-xl font-bold">Bracket Challenge Winner</h2>
            <p className="mt-2 text-2xl font-extrabold text-purple-600 dark:text-purple-400">
              {predictionWinner.displayName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {predictionWinner.totalPoints} points &middot; {predictionWinner.correctCount} correct predictions
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
