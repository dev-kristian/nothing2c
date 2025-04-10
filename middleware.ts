import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROOT_PREFIXES = ['/discover', '/details', '/my-library', '/search', '/settings', '/social', '/top-watchlist', '/watch-together'];
// Removed WELCOME_PREFIXES
const AUTH_PREFIXES = ['/sign-in', '/sign-up', '/forgot-password', '/verify-email', '/auth-action'];
const PUBLIC_PATHS = ['/']; // Explicitly define public paths like the landing page

// Helper function to check if path starts with any prefix in a list
const checkPathPrefix = (path: string, prefixes: string[]) => {
  return prefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;

  // Default auth status
  let authResult = {
    isAuthenticated: false,
    uid: null,
    // Removed setupCompleted and hasUsername
  };

  // 1. Skip middleware for static assets, API routes, etc.
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') || 
    pathname.startsWith('/icons/') || 
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname.includes('.') ||
    PUBLIC_PATHS.includes(pathname) // Allow access to explicitly public paths like '/'
  ) {
    return NextResponse.next();
  }

  // 2. Verify session cookie if present
  if (sessionCookie) {
    try {
      // Use absolute URL for fetch in middleware
      const verifyUrl = new URL('/api/auth/verify-session', request.url).toString();
      const response = await fetch(verifyUrl, {
        headers: {
          'Cookie': `__session=${sessionCookie}`
        },
        cache: 'no-store', // Ensure fresh check
      });

      if (response.ok) {
        authResult = await response.json(); // Get { isAuthenticated, uid }
      } else {
         // If verify fails (e.g., 401), treat as unauthenticated
         console.warn(`[Middleware] Session verification failed for ${pathname} with status ${response.status}`);
         // Optionally clear the bad cookie - handled by API now
      }
    } catch (error) {
      console.error(`[Middleware] Network error fetching session verification API for ${pathname}:`, error);
      // Treat as unauthenticated on error
    }
  }

  // 3. Determine route types
  const isRootRoute = checkPathPrefix(pathname, ROOT_PREFIXES);
  // Removed isWelcomeRoute
  const isAuthRoute = checkPathPrefix(pathname, AUTH_PREFIXES);

  // Destructure the results
  const { isAuthenticated } = authResult;

  // 4. Apply Simplified Routing Rules

  // Rule 1: Not Authenticated
  if (!isAuthenticated) {
    // If trying to access a protected root route, redirect to sign-in
    if (isRootRoute) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirectedFrom', pathname);
      console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /sign-in`);
      return NextResponse.redirect(signInUrl);
    }
    // Allow access to AUTH routes and PUBLIC paths (already handled by initial check)
  }

  // Rule 2: Authenticated
  if (isAuthenticated) {
     // If authenticated, redirect away from auth pages (except verify/action which might be needed transiently)
     if (isAuthRoute && pathname !== '/verify-email' && pathname !== '/auth-action') {
       const discoverUrl = new URL('/discover', request.url); // Default redirect for authenticated users
       console.log(`[Middleware] Redirecting authenticated user from AUTH route ${pathname} to /discover`);
       return NextResponse.redirect(discoverUrl);
     }
     // Allow access to ROOT routes and PUBLIC paths (already handled)
  }

  // 5. Allow request to proceed if no redirect rules matched
  return NextResponse.next();
}


export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
