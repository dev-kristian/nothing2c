import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';
import { adminAuth, adminDb } from './firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { UserData, UserProfile } from '@/types/user';

type FirestoreUserData = Partial<
  UserData & {
    createdAt?: admin.firestore.Timestamp;
    updatedAt?: admin.firestore.Timestamp;
  }
>;

async function getSessionCookieValue() {
  const cookieStore = await cookies();
  return cookieStore.get('__session')?.value ?? null;
}

async function verifyAuthenticatedSession(): Promise<DecodedIdToken | null> {
  const sessionCookie = await getSessionCookieValue();

  if (!sessionCookie) {
    return null;
  }

  const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

  if (!decodedToken.email_verified) {
    const error = new Error('Email is not verified for this session.');
    (error as Error & { code: string }).code = 'auth/email-not-verified';
    throw error;
  }

  return decodedToken;
}

function extractErrorMetadata(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return {};
  }

  return {
    errorCode:
      'code' in error && typeof (error as { code: unknown }).code === 'string'
        ? (error as { code: string }).code
        : undefined,
    errorMessage:
      'message' in error && typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : undefined,
  };
}

function logServerAuthError(error: unknown) {
  const { errorCode, errorMessage } = extractErrorMetadata(error);

  if (errorCode?.startsWith('auth/')) {
    console.error('[Server Auth] Session verification failed:', errorCode, errorMessage);
    return;
  }

  console.error('[Server Auth] Unexpected error during authentication:', error);
}

function toIsoTimestamp(timestamp?: admin.firestore.Timestamp | null) {
  return timestamp?.toDate?.().toISOString() || new Date(0).toISOString();
}

export async function getAuthenticatedUserProfile(): Promise<UserProfile | null> {
  try {
    const decodedToken = await verifyAuthenticatedSession();

    if (!decodedToken) {
      return null;
    }

    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const firestoreData = userDoc.exists ? userDoc.data() : {};
    const userDataFromFirestore = firestoreData as FirestoreUserData;

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      username: userDataFromFirestore?.username || '',
      photoURL: userDataFromFirestore?.photoURL || null,
      createdAt: toIsoTimestamp(userDataFromFirestore?.createdAt),
      updatedAt: toIsoTimestamp(userDataFromFirestore?.updatedAt),
    };
  } catch (error: unknown) {
    logServerAuthError(error);
    return null;
  }
}

export async function getFullAuthenticatedUser(): Promise<Omit<UserData, 'watchlist'> | null> {
  try {
    const decodedToken = await verifyAuthenticatedSession();

    if (!decodedToken) {
      return null;
    }

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
    logServerAuthError(error);
    return null;
  }
}
