import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

const expiresIn = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken?.toString();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    // Verify the ID token (optional here, createSessionCookie also verifies)
    // We don't need the decoded token here anymore.
    // const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Create the session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set cookie options
    const options = {
      name: '__session', 
      value: sessionCookie,
      maxAge: expiresIn / 1000, 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      path: '/', 
      sameSite: 'lax' as const, 
    };

    // Create the response and set the cookie
    const response = NextResponse.json({ status: 'success' }, { status: 200 }); // Just return success
    response.cookies.set(options);

    return response;

  } catch (error: any) {
    console.error('[API Session Login] Error creating session cookie:', error);
    if (error.code === 'auth/invalid-id-token' || error.code === 'auth/id-token-expired') {
       return NextResponse.json({ error: 'Invalid or expired ID token.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create session cookie.' }, { status: 500 });
  }
}
