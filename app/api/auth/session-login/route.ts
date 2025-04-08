import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const expiresIn = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken?.toString();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const options = {
      name: '__session', 
      value: sessionCookie,
      maxAge: expiresIn / 1000, 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      path: '/', 
      sameSite: 'lax' as const, 
    };

    const response = NextResponse.json({ status: 'success' }, { status: 200 }); 
    response.cookies.set(options);

    return response;

  } catch (error: unknown) {
    console.error('[API Session Login] Error creating session cookie:', error);
    // Type check for Firebase error structure
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string }; // Type assertion after check
      if (firebaseError.code === 'auth/invalid-id-token' || firebaseError.code === 'auth/id-token-expired') {
         return NextResponse.json({ error: 'Invalid or expired ID token.' }, { status: 401 });
      }
    }
    // Generic error response if it's not a recognized Firebase error
    return NextResponse.json({ error: 'Failed to create session cookie. Unknown error occurred.' }, { status: 500 });
  }
}
