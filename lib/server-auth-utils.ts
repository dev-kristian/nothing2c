import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';
import { adminAuth, adminDb } from './firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { UserData, UserProfile } from '@/types/user'; 

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

    const userDataFromFirestore = firestoreData as Partial<UserData & { createdAt?: admin.firestore.Timestamp, updatedAt?: admin.firestore.Timestamp }>;

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      username: userDataFromFirestore?.username || '',
      photoURL: userDataFromFirestore?.photoURL || null, 
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

export async function getFullAuthenticatedUser(): Promise<Omit<UserData, 'watchlist'> | null> {
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

    const userData: Omit<UserData, 'watchlist'> = {
      uid: decodedToken.uid,
      email: decodedToken.email ?? undefined, 
      username: firestoreData.username || '',
      photoURL: firestoreData.photoURL || null,
    };

    if (firestoreData.notification) {
      userData.notification = firestoreData.notification;
    }
    if (firestoreData.createdAt) {
        userData.createdAt = (firestoreData.createdAt as admin.firestore.Timestamp).toDate();
    }
     if (firestoreData.updatedAt) {
        userData.updatedAt = (firestoreData.updatedAt as admin.firestore.Timestamp).toDate();
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
