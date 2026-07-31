import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Só protege as páginas do app — as rotas de API e as páginas de login
// checam a sessão de verdade sozinhas.
export const config = {
  matcher: ['/painel', '/historico', '/categorias'],
};
