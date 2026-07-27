import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Only guards the protected app pages. API routes and auth pages check
// the real session themselves, and don't rely on this cookie-presence check.
export const config = {
  matcher: ['/painel', '/historico', '/categorias'],
};
