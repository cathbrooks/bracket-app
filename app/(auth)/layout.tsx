import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/server';
import { ROUTES } from '@/lib/constants';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (user) {
    redirect(ROUTES.organizer.dashboard);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Bracket<span className="text-primary">App</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create and manage tournament brackets
        </p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
