import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      include: [
        'lib/**/*.ts',
        'hooks/**/*.ts',
        'components/**/*.tsx',
        'middleware.ts',
      ],
      exclude: [
        'lib/database.types.ts',
        'lib/types/**',
        'lib/monitoring/**',
        'lib/supabase/**',
        'lib/config.ts',
        'lib/services/bracket/generateBracket.ts',
        'lib/services/predictions/scorePredictions.ts',
        'lib/services/seeding/assignManualSeeds.ts',
        'lib/services/seeding/generateLeaderboard.ts',
        'lib/services/teams/createTeams.ts',
        'lib/services/tournaments/createTournament.ts',
        'lib/services/tournaments/updateTournament.ts',
        'lib/services/tournaments/generateJoinCode.ts',
        'lib/validation/tournament.validation.ts',
        'lib/realtime/connection.ts',
        'components/ui/**',
        'components/predictions/BracketPredictionForm.tsx',
        'components/predictions/SubmittedPredictions.tsx',
        'components/seeding/SeedingWorkflow.tsx',
        'components/seeding/TimeTrialInterface.tsx',
        'components/tournaments/BracketView.tsx',
        'components/tournaments/SeedingManager.tsx',
        'components/tournaments/steps/**',
        'hooks/useRealtimeBracket.ts',
        'hooks/useRealtimeLeaderboard.ts',
        'hooks/useRealtimeReactions.ts',
        'hooks/useRealtimeTournament.ts',
        '**/*.d.ts',
        '**/__tests__/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
