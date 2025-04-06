import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define path prefixes for route groups
// Ensure these accurately reflect your route structure
const ROOT_PREFIXES = ['/discover', '/details', '/my-library', '/search', '/settings', '/social', '/top-watchlist', '/watch-together']; // Added /discover
const WELCOME_PREFIXES = ['/welcome'];
const AUTH_PREFIXES = ['/sign-in', '/sign-up', '/forgot-password', '/verify-email', '/auth-action'];

// Make the middleware async to use await for fetch
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;
  let isAuthenticated = false; // Default to false

  // --- Skip middleware for specific static assets often missed by matcher ---
  // Add more specific file paths or patterns if needed
  if (
    pathname.startsWith('/_next/') || // Next.js internal assets
    pathname.startsWith('/api/') || // API routes
    pathname.startsWith('/icons/') || // Public assets
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname.includes('.') // Generally includes files like .ico, .png, .js, .css
  ) {
    // console.log(`[Middleware] Skipping asset/API path: ${pathname}`);
    return NextResponse.next();
  }
  // console.log(`[Middleware] Running for path: ${pathname}`);

  // If a session cookie exists, verify it via the internal API route
  if (sessionCookie) {
    try {
      // Construct the absolute URL for the fetch request
      const verifyUrl = new URL('/api/auth/verify-session', request.url);
      const response = await fetch(verifyUrl.toString(), {
        headers: {
          // Forward the cookie to the API route for verification
          'Cookie': `__session=${sessionCookie}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        isAuthenticated = data.isAuthenticated;
        // console.log(`[Middleware] Session verification result for ${pathname}: ${isAuthenticated}`);
      } else {
        // Treat failed verification as unauthenticated
        // console.warn(`[Middleware] Session verification API call failed for ${pathname} with status: ${response.status}`);
        isAuthenticated = false;
      }
    } catch (error) {
      // Treat fetch errors as unauthenticated
      console.error(`[Middleware] Error fetching session verification API for ${pathname}:`, error);
      isAuthenticated = false;
    }
  }


  // Helper to check if pathname starts with any prefix in a list
  const checkPath = (prefixes: string[]) => {
    // Check if pathname exactly matches a prefix or starts with prefix + '/'
    return prefixes.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'));
  }

  // Determine which area the user is trying to access
  // The root path '/' is now public (landing page) and not included here.
  const isAccessingRootProtected = checkPath(ROOT_PREFIXES);
  const isAccessingWelcome = checkPath(WELCOME_PREFIXES);
  const isAccessingAuth = checkPath(AUTH_PREFIXES);

  // Define protected routes (excluding the public landing page '/')
  const isProtectedRoute = isAccessingRootProtected || isAccessingWelcome;
  const isAuthRoute = isAccessingAuth;

  // Rule 1: Unauthenticated user tries to access protected route
  if (!isAuthenticated && isProtectedRoute) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectedFrom', pathname); // Remember original path
    console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /sign-in`);
    return NextResponse.redirect(signInUrl);
  }

  // Rule 2: Authenticated user tries to access auth route
  if (isAuthenticated && isAuthRoute) {
    const discoverUrl = new URL('/discover', request.url);
    console.log(`[Middleware] Redirecting authenticated user from ${pathname} to /discover`);
    return NextResponse.redirect(discoverUrl); // Redirect to discover page
  }

  // Allow request to proceed if no rules matched
  // console.log(`[Middleware] Allowing request for ${pathname}`);
  return NextResponse.next();
}

// Matcher configuration: More focused on general paths, letting the code above handle specifics
// This aims to run middleware on most page navigations but exclude common static file patterns.
// Note: The explicit checks at the start of the middleware function provide finer control.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Specific public folders if needed (e.g., /icons/, /images/) - handled in code above
     *
     * This simplified matcher relies more on the checks within the middleware function.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
