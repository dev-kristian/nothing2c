import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROOT_PREFIXES = ['/discover', '/details', '/my-library', '/search', '/settings', '/social', '/top-watchlist', '/watch-together'];
const WELCOME_PREFIXES = ['/welcome'];
const AUTH_PREFIXES = ['/sign-in', '/sign-up', '/forgot-password', '/verify-email', '/auth-action'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;
  let isAuthenticated = false;

  if (
    pathname.startsWith('/_next/') || 
    pathname.startsWith('/api/') || 
    pathname.startsWith('/icons/') || 
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname.includes('.') 
  ) {
    return NextResponse.next();
  }
  if (sessionCookie) {
    try {
      const verifyUrl = new URL('/api/auth/verify-session', request.url);
      const response = await fetch(verifyUrl.toString(), {
        headers: {
          'Cookie': `__session=${sessionCookie}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        isAuthenticated = data.isAuthenticated;
      } else {
        isAuthenticated = false;
      }
    } catch (error) {
      console.error(`[Middleware] Error fetching session verification API for ${pathname}:`, error);
      isAuthenticated = false;
    }
  }


  const checkPath = (prefixes: string[]) => {
    return prefixes.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'));
  }

  const isAccessingRootProtected = checkPath(ROOT_PREFIXES);
  const isAccessingWelcome = checkPath(WELCOME_PREFIXES);
  const isAccessingAuth = checkPath(AUTH_PREFIXES);

  const isProtectedRoute = isAccessingRootProtected || isAccessingWelcome;
  const isAuthRoute = isAccessingAuth;

  if (!isAuthenticated && isProtectedRoute) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectedFrom', pathname); 
    console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /sign-in`);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthenticated && isAuthRoute) {
    const discoverUrl = new URL('/discover', request.url);
    console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /discover`);
    return NextResponse.redirect(discoverUrl); 
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
