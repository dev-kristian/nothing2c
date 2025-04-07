import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers'; 

export async function GET(request: NextRequest) {
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }

  try {
    // Verify the cookie and check for revocation.
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Check if email is verified
    if (!decodedClaims.email_verified) {
      console.log(`[API Verify Session] User ${decodedClaims.uid} email not verified.`);
      // Treat as unauthenticated if email is not verified
      // Optionally, clear the cookie here too, or let the middleware handle redirection
      // Clearing might be better to prevent repeated checks for unverified users
      const response = NextResponse.json({ isAuthenticated: false, reason: 'email_not_verified' }, { status: 401 });
      // response.cookies.set('__session', '', { maxAge: 0, path: '/' }); // Keep cookie for now, let user verify
      return response;
    }

    // Email is verified, return relevant claims
    return NextResponse.json({
      isAuthenticated: true, // Only true if email is verified
      uid: decodedClaims.uid,
      hasUsername: decodedClaims.hasUsername || false // Default to false if claim not present
    }, { status: 200 });

  } catch (error: any) {
    // Session cookie is invalid or expired.
    console.error('[API Verify Session] Error verifying session cookie:', error.code || error.message);
    // Clear the invalid cookie by setting Max-Age to 0
    const response = NextResponse.json({ isAuthenticated: false }, { status: 401 });
    response.cookies.set('__session', '', { maxAge: 0, path: '/' });
    return response;
  }
}
