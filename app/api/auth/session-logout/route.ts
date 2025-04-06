import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
// Optional: Import adminAuth if you want to revoke session cookies server-side
// import { adminAuth } from '@/lib/firebase-admin';

export async function POST() {
  try {
    // Clear the session cookie by setting maxAge to 0 or a past expiry date
    const options = {
      name: '__session',
      value: '', // Set value to empty
      maxAge: -1, // Expire immediately
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    };

    cookies().set(options);

    // Optional: Revoke the actual session on Firebase side
    // This requires getting the user's UID from the session cookie *before* clearing it.
    // const sessionCookie = cookies().get('__session')?.value;
    // if (sessionCookie) {
    //   try {
    //     const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    //     await adminAuth.revokeRefreshTokens(decodedToken.uid);
    //     console.log('[API Session Logout] Revoked refresh tokens for UID:', decodedToken.uid);
    //   } catch (revokeError: any) {
    //     // Log error but don't fail the logout process if revocation fails
    //     console.error('[API Session Logout] Error revoking refresh tokens:', revokeError);
    //   }
    // }

    // console.log('[API Session Logout] Session cookie cleared.');
    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: any) {
    console.error('[API Session Logout] Error clearing session cookie:', error);
    return NextResponse.json({ error: 'Failed to clear session cookie.' }, { status: 500 });
  }
}
