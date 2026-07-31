import { headers } from 'next/headers';
import { auth } from './auth';

/**
 * Lê e valida a sessão de verdade (bate no banco) — usado nas Route Handlers,
 * Server Components e Server Actions. É aqui que a checagem de autenticação
 * de verdade acontece, não no proxy.ts (que só faz uma checagem leve/otimista).
 */
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
