import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


const PROTECTED_ROOT_ROUTES = ['/my-library', '/settings', '/social', '/watch-together'];
const AUTH_PREFIXES = ['/sign-in', '/sign-up', '/forgot-password', '/verify-email', '/auth-action'];

const PUBLIC_API_ROUTES = [
  '/api/trending',
  '/api/upcoming',
  '/api/search',
  '/api/genres',
  '/api/details',
  '/api/auth/verify-session', 
];


const checkPathPrefix = (path: string, prefixes: string[]) => {
  return prefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;

  
  let authResult = {
    isAuthenticated: false,
    uid: null,
    
  };

  
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname.includes('.') 
  ) {
    return NextResponse.next();
  }

  
  if (PUBLIC_API_ROUTES.some(apiPath => pathname.startsWith(apiPath))) {
    return NextResponse.next();
  }

  
  const isProtectedRoute = checkPathPrefix(pathname, PROTECTED_ROOT_ROUTES);
  
  const isAuthRoute = checkPathPrefix(pathname, AUTH_PREFIXES);

  
  if (sessionCookie && isProtectedRoute) {
    try {
      
      const verifyUrl = new URL('/api/auth/verify-session', request.url).toString();
      const response = await fetch(verifyUrl, {
        headers: {
          'Cookie': `__session=${sessionCookie}`
        },
        cache: 'no-store', 
      });

      if (response.ok) {
        authResult = await response.json(); 
      } else {
         
         console.warn(`[Middleware] Session verification failed for ${pathname} with status ${response.status}`);
         
      }
    } catch (error) {
      console.error(`[Middleware] Network error fetching session verification API for ${pathname}:`, error);
      
    }
  } else if (sessionCookie && !isProtectedRoute) {
    
    
    authResult = { isAuthenticated: true, uid: null }; 
  }
  

  
  const { isAuthenticated } = authResult;

  

  
  if (!isAuthenticated) {
    
    if (isProtectedRoute) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(signInUrl);
    }
    
  }

  
  if (isAuthenticated) {
     
     if (isAuthRoute && pathname !== '/verify-email' && pathname !== '/auth-action') {
       const homeUrl = new URL('/', request.url); 
       return NextResponse.redirect(homeUrl);
     }
     
  }

  
  return NextResponse.next();
}


export const config = {
  
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|images/|fonts/).*)',
  ],
}
