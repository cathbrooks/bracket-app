import { TournamentSetupWizard } from '@/components/tournaments/TournamentSetupWizard';

export default function CreateTournamentPage() {
  return (
    <div className="container py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create Tournament</h1>
        <p className="mt-2 text-muted-foreground">
          Set up your tournament in a few quick steps.
        </p>
      </div>
      <TournamentSetupWizard />
    </div>
  );
}
