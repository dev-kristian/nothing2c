import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Import adminDb
import { FieldValue } from 'firebase-admin/firestore'; // Import FieldValue

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
    const emailVerified = decodedToken.email_verified === true;

    // 2. Determine setupCompleted status and ensure user document exists if email is verified
    let setupCompleted = false; // Default to false

    if (emailVerified) {
      const userDocRef = adminDb.collection('users').doc(uid);
      try {
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
          // Document exists, read its status
          setupCompleted = userDoc.data()?.setupCompleted === true;
          console.log(`[API Session Login] User doc exists for UID: ${uid}. setupCompleted: ${setupCompleted}`);
        } else {
          // Document does NOT exist, create it with setupCompleted: false
          console.log(`[API Session Login] User doc not found for verified UID: ${uid}. Creating document.`);
          const initialUserData = {
            uid: uid,
            email: decodedToken.email, // Use email from token
            createdAt: FieldValue.serverTimestamp(), // Use FieldValue for server timestamp
            username: "", // Initialize username as empty
            setupCompleted: false, // Explicitly set to false
          };
          await userDocRef.set(initialUserData);
          setupCompleted = false; // Ensure setupCompleted is false for the claim
          console.log(`[API Session Login] Successfully created user document for UID: ${uid}.`);
        }
      } catch (dbError) {
        console.error(`[API Session Login] Error accessing/creating user document for UID: ${uid}`, dbError);
        // Keep setupCompleted as false on DB error
      }
    } else {
      console.log(`[API Session Login] Email not verified for UID: ${uid}. Skipping doc check/creation. setupCompleted remains false.`);
      // Keep setupCompleted as false if email is not verified
    }

    // 3. Set custom claim on the user based on the determined status
    await adminAuth.setCustomUserClaims(uid, { setupCompleted });
    console.log(`[API Session Login] Set custom claim setupCompleted=${setupCompleted} for UID: ${uid}`);

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
