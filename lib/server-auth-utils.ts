import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebase-admin'; 
import type { DecodedIdToken } from 'firebase-admin/auth';

export interface UserProfile {
  uid: string;
  email?: string;
  username?: string;
  setupCompleted?: boolean;
}

export async function getAuthenticatedUserProfile(): Promise<UserProfile | null> {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken: DecodedIdToken = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const firestoreData = userDoc.exists ? userDoc.data() : {};

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      username: firestoreData?.username,
      setupCompleted: firestoreData?.setupCompleted === true,
    };

  } catch (error: unknown) {
    let errorCode: string | undefined;
    let errorMessage: string | undefined;

    // Safely check for properties on the unknown error type
    if (typeof error === 'object' && error !== null) {
      if ('code' in error && typeof (error as { code: unknown }).code === 'string') {
        errorCode = (error as { code: string }).code;
      }
      if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
        errorMessage = (error as { message: string }).message;
      }
    }

    if (errorCode?.startsWith('auth/')) {
      console.error('[Server Auth] Session verification failed:', errorCode, errorMessage);
    } else {
      // Log the original error object if it's not a recognized Firebase auth error
      console.error('[Server Auth] Unexpected error during authentication:', error);
    }
    return null;
  }
}

export async function getUserProfileStatus(): Promise<{ uid: string; setupCompleted: boolean } | null> {
   const userProfile = await getAuthenticatedUserProfile();
   if (!userProfile) {
     return null;
   }
   return {
     uid: userProfile.uid,
     setupCompleted: userProfile.setupCompleted ?? false
   };
}
