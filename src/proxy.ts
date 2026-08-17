import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './lib/auth';

const PUBLIC = ['/login', '/register', '/industry'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC.some((p) => pathname.startsWith(p)) || pathname === '/';

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (session && (pathname === '/login' || pathname === '/register')) {
    if (session.mustChangePassword) {
      return NextResponse.redirect(new URL('/account/password', req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isPublic) return NextResponse.next();

  if (!session) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (session.mustChangePassword && !pathname.startsWith('/account/password')) {
    return NextResponse.redirect(new URL('/account/password', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|cutm-logo.png|.*\\..*).*)'],
};
