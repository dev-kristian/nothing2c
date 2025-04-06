import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin'; // Adjust path if needed
import { cookies } from 'next/headers'; // Use next/headers for Route Handlers

export async function GET(request: NextRequest) {
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    // No cookie, definitely not authenticated via session
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }

  try {
    // Verify the session cookie. Crucially, check if revoked.
    await adminAuth.verifySessionCookie(sessionCookie, true);
    // If verification succeeds, the user is authenticated
    return NextResponse.json({ isAuthenticated: true }, { status: 200 });
  } catch (error) {
    // Verification failed (expired, revoked, invalid, etc.)
    // console.error('[API Verify Session] Verification failed:', error); // Optional logging
    // Clear the invalid cookie? Maybe not here, let middleware handle redirect/clear
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }
}

// Optional: Handle potential POST requests or other methods if needed,
// otherwise they will default to 405 Method Not Allowed.
