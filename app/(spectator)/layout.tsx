import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function SpectatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-12 items-center">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight">
              Bracket<span className="text-primary">App</span>
            </span>
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
