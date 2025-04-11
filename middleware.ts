import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route categories based on the new structure
const PROTECTED_ROOT_ROUTES = ['/my-library', '/settings', '/social', '/watch-together'];
const AUTH_PREFIXES = ['/sign-in', '/sign-up', '/forgot-password', '/verify-email', '/auth-action'];
// Removed unused ROOT_PREFIXES and PUBLIC_PATHS constants
const PUBLIC_API_ROUTES = [
  '/api/trending',
  '/api/upcoming',
  '/api/search',
  '/api/genres',
  '/api/details',
  '/api/auth/verify-session', // Needed for middleware itself
];

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

  // 1. Skip middleware for static assets, specific public API routes, etc.
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname.includes('.') // Assume files with extensions are static assets
  ) {
    return NextResponse.next();
  }

  // Allow access to explicitly defined public API routes
  if (PUBLIC_API_ROUTES.some(apiPath => pathname.startsWith(apiPath))) {
    return NextResponse.next();
  }

  // Determine route types *before* potentially verifying session
  const isProtectedRoute = checkPathPrefix(pathname, PROTECTED_ROOT_ROUTES);
  // Removed unused isRootRoute variable
  const isAuthRoute = checkPathPrefix(pathname, AUTH_PREFIXES);

  // 2. Verify session cookie ONLY for protected routes if present
  if (sessionCookie && isProtectedRoute) {
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
      // Treat as unauthenticated on error for protected routes
    }
  } else if (sessionCookie && !isProtectedRoute) {
    // For non-protected routes, if a cookie exists, assume authenticated *for redirection purposes only*
    // The actual verification happens client-side or via server components/actions
    authResult = { isAuthenticated: true, uid: null }; // Set basic authenticated state
  }
  // If no cookie, authResult remains { isAuthenticated: false, uid: null }

  // Destructure the results (potentially updated above)
  const { isAuthenticated } = authResult;

  // 4. Apply Simplified Routing Rules

  // Rule 1: Not Authenticated
  if (!isAuthenticated) {
    // If trying to access a protected route, redirect to sign-in
    if (isProtectedRoute) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirectedFrom', pathname);
      console.log(`[Middleware] Redirecting unauthenticated user from protected route ${pathname} to /sign-in`);
      return NextResponse.redirect(signInUrl);
    }
    // Allow access to AUTH routes and all other non-protected routes (like /, /search, /details)
  }

  // Rule 2: Authenticated
  if (isAuthenticated) {
     // If authenticated, redirect away from auth pages (except verify/action)
     if (isAuthRoute && pathname !== '/verify-email' && pathname !== '/auth-action') {
       const homeUrl = new URL('/', request.url); // Default redirect for authenticated users is now the root page
       console.log(`[Middleware] Redirecting authenticated user from AUTH route ${pathname} to /`);
       return NextResponse.redirect(homeUrl);
     }
     // Allow access to all other routes (protected, public, etc.)
  }

  // 5. Allow request to proceed if no redirect rules matched
  return NextResponse.next();
}


export const config = {
  // Update matcher to avoid broadly excluding /api, rely on explicit checks above
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|images/|fonts/).*)',
  ],
}
