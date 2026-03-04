function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Check your .env.local file or deployment environment.`
    );
  }
  return value;
}

function requireServerEnv(name: string): string {
  if (typeof window !== 'undefined') {
    throw new Error(
      `${name} is a server-only environment variable and cannot be accessed in the browser.`
    );
  }
  return requireEnv(name);
}

export const config = {
  supabase: {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    get serviceRoleKey() {
      return requireServerEnv('SUPABASE_SERVICE_ROLE_KEY');
    },
  },
  siteUrl: requireEnv('NEXT_PUBLIC_SITE_URL'),
} as const;
