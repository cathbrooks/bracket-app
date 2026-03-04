import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">
              Bracket<span className="text-primary">App</span>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-4 text-sm">
            <Link
              href={ROUTES.organizer.dashboard}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href={ROUTES.organizer.create}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              New Tournament
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
