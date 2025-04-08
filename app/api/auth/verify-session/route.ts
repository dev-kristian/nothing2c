import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function GET() {
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    if (!decodedClaims.email_verified) {
      console.log(`[API Verify Session] User ${decodedClaims.uid} email not verified.`);
      const response = NextResponse.json({ isAuthenticated: false, reason: 'email_not_verified' }, { status: 401 });
      return response;
    }

    return NextResponse.json({
      isAuthenticated: true,
      uid: decodedClaims.uid,
      hasUsername: decodedClaims.hasUsername || false
    }, { status: 200 });

  } catch (error: unknown) {
    let errorMessage = 'Unknown error verifying session cookie';
    let errorCode: string | undefined;
    if (error instanceof Error) {
      errorMessage = error.message;
      if (typeof error === 'object' && error !== null && 'code' in error) {
        errorCode = (error as { code: string }).code;
      }
    }
    console.error('[API Verify Session] Error verifying session cookie:', errorCode || errorMessage);
    const response = NextResponse.json({ isAuthenticated: false }, { status: 401 });
    response.cookies.set('__session', '', { maxAge: 0, path: '/' }); 
    return response;
  }
}
