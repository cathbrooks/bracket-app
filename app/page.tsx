import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Bracket
          <span className="text-primary">App</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Create tournament brackets, manage seeding, and let spectators follow
          along in real time.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href={ROUTES.organizer.create}
            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Create Tournament
          </Link>
          <Link
            href={ROUTES.spectator.join}
            className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Join as Spectator
          </Link>
        </div>
      </div>
    </div>
  );
}
