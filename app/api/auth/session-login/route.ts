import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

// Set session expiration (e.g., 5 days)
const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken?.toString();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    // Verify the ID token first (optional but good practice)
    // This ensures the token sent from the client is valid before creating a session cookie
    await adminAuth.verifyIdToken(idToken);

    // Create the session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set cookie policy for session cookie.
    const options = {
      name: '__session', // Cookie name
      value: sessionCookie,
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      path: '/', // Cookie available across the entire site
      sameSite: 'lax' as const, // Recommended SameSite policy
    };

    // Set the cookie using the ResponseCookies API available via `cookies()` in Route Handlers
    cookies().set(options);

    // console.log('[API Session Login] Session cookie created successfully.');
    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: any) {
    console.error('[API Session Login] Error creating session cookie:', error);
    // Handle specific errors like invalid token if needed
    if (error.code === 'auth/invalid-id-token' || error.code === 'auth/id-token-expired') {
       return NextResponse.json({ error: 'Invalid or expired ID token.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create session cookie.' }, { status: 500 });
  }
}
