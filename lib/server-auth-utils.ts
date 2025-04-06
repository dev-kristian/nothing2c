import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebase-admin'; // Assumes firebase-admin.ts exports initialized auth and db
import type { DecodedIdToken } from 'firebase-admin/auth';

// Define a consistent type for your user data from Firestore and Token
// Adjust fields based on your actual Firestore structure and needs
export interface UserProfile {
  uid: string;
  email?: string;
  username?: string;
  setupCompleted?: boolean;
  // Add other fields you need from Firestore or token
}

/**
 * Verifies the session cookie and fetches user data.
 * Returns user profile object or null if not authenticated or error occurs.
 */
export async function getAuthenticatedUserProfile(): Promise<UserProfile | null> {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    // console.log('[Server Auth] No session cookie found.');
    return null;
  }

  try {
    // Verify the session cookie. Checks for revocation.
    // console.log('[Server Auth] Verifying session cookie...');
    const decodedToken: DecodedIdToken = await adminAuth.verifySessionCookie(
      sessionCookie,
      true // checkRevoked = true
    );
    // console.log('[Server Auth] Session cookie verified for UID:', decodedToken.uid);

    // Fetch Firestore data
    // console.log('[Server Auth] Fetching Firestore data for UID:', decodedToken.uid);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const firestoreData = userDoc.exists ? userDoc.data() : {};
    // console.log('[Server Auth] Firestore data:', firestoreData);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      username: firestoreData?.username,
      // Ensure boolean, default to false if undefined/null in Firestore
      setupCompleted: firestoreData?.setupCompleted === true,
      // Add other merged data as needed
    };

  } catch (error: any) {
    // Log specific Firebase auth errors
    if (error.code?.startsWith('auth/')) {
      console.error('[Server Auth] Session verification failed:', error.code, error.message);
    } else {
      console.error('[Server Auth] Unexpected error during authentication:', error);
    }
    // Optionally clear the invalid cookie here if needed, though redirects handle access control
    // cookies().set('__session', '', { maxAge: -1, path: '/' });
    return null; // Treat as unauthenticated on any error
  }
}

/**
 * Specific utility for layouts needing only profile status.
 * Returns profile status object or null if not authenticated/found.
 */
export async function getUserProfileStatus(): Promise<{ uid: string; setupCompleted: boolean } | null> {
   const userProfile = await getAuthenticatedUserProfile();
   if (!userProfile) {
     return null;
   }
   // We assume setupCompleted exists, defaulting to false if undefined in Firestore
   return {
     uid: userProfile.uid,
     setupCompleted: userProfile.setupCompleted ?? false
   };
}
