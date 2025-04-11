import { cookies } from 'next/headers';
import * as admin from 'firebase-admin'; // Import the admin namespace
import { adminAuth, adminDb } from './firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { UserData, UserProfile } from '@/types/user'; // Import UserProfile from types/user

// Removed local UserProfile interface definition

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

    // Ensure firestoreData is treated as potentially having any user fields
    // Ensure firestoreData is treated as potentially having any user fields, including Timestamps
    const userDataFromFirestore = firestoreData as Partial<UserData & { createdAt?: admin.firestore.Timestamp, updatedAt?: admin.firestore.Timestamp }>;

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null, // Ensure email is null if undefined
      username: userDataFromFirestore?.username || '', // Provide default empty string
      photoURL: userDataFromFirestore?.photoURL || null, // Fetch photoURL
      // Convert timestamps if they exist, otherwise use defaults or handle appropriately
      createdAt: userDataFromFirestore?.createdAt?.toDate?.().toISOString() || new Date(0).toISOString(),
      updatedAt: userDataFromFirestore?.updatedAt?.toDate?.().toISOString() || new Date(0).toISOString(),
    };

  } catch (error: unknown) {
    let errorCode: string | undefined;
    let errorMessage: string | undefined;

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
      console.error('[Server Auth] Unexpected error during authentication:', error);
    }
    return null;
  }
}

export async function getFullAuthenticatedUser(): Promise<UserData | null> {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken: DecodedIdToken = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );
    
    const userDocRef = adminDb.collection('users').doc(decodedToken.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.warn(`[Server Auth] User document not found for UID: ${decodedToken.uid}`);
      return null; 
    }

    const firestoreData = userDoc.data() || {};

    const userData: UserData = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      username: firestoreData.username || '', 
      watchlist: firestoreData.watchlist || { movie: [], tv: [] },
    };
    
    if (firestoreData.notification) {
      userData.notification = firestoreData.notification;
    }

    return userData;

  } catch (error: unknown) {
    let errorCode: string | undefined;
    let errorMessage: string | undefined;

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
      console.error('[Server Auth] Unexpected error during authentication:', error);
    }
    return null;
  }
}
