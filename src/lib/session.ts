import { headers } from 'next/headers';
import { auth } from './auth';

/**
 * Reads and validates the real session (hits the database), for use in
 * Route Handlers, Server Components, and Server Actions — the place Better
 * Auth's own docs recommend doing the actual auth check, as opposed to the
 * lightweight cookie-presence check in proxy.ts.
 */
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
