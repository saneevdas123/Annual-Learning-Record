import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './lib/auth';

// Routes that never require a session.
const PUBLIC = ['/login', '/register', '/industry'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC.some((p) => pathname.startsWith(p)) || pathname === '/';

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Signed-in users landing on auth pages go to their dashboard.
  if (session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isPublic) return NextResponse.next();

  if (!session) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except Next internals, static files, and the API auth route.
  matcher: ['/((?!_next/static|_next/image|favicon.svg|api/auth).*)'],
};
