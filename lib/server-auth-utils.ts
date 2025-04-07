import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebase-admin'; // Assumes firebase-admin.ts exports initialized auth and db
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

  } catch (error: any) {
    if (error.code?.startsWith('auth/')) {
      console.error('[Server Auth] Session verification failed:', error.code, error.message);
    } else {
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
