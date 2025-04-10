import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Import adminDb

const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken?.toString();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    // 1. Verify ID token to get UID
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Fetch user data from Firestore
    let setupCompleted = false;
    try {
      const userDocRef = adminDb.collection('users').doc(uid);
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        setupCompleted = userDoc.data()?.setupCompleted === true;
      } else {
        console.warn(`[API Session Login] User document not found for UID: ${uid} during login. Assuming setup not completed.`);
      }
    } catch (dbError) {
      console.error(`[API Session Login] Error fetching user document for UID: ${uid}`, dbError);
      // Proceed, but setupCompleted remains false
    }

    // 3. Set custom claim on the user
    await adminAuth.setCustomUserClaims(uid, { setupCompleted });

    // 4. Create session cookie (claims are automatically included)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // 5. Set cookie options
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
