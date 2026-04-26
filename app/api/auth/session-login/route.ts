import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { adjectives, nouns } from '@/constants/usernameParts';

const expiresIn = 60 * 60 * 24 * 5 * 1000;
const MAX_USERNAME_GENERATION_ATTEMPTS = 10;
const MAX_USERNAME_LENGTH = 20;
const RECENT_SIGN_IN_WINDOW_SECONDS = 5 * 60;

async function isUsernameAvailable(username: string): Promise<boolean> {
  const usersRef = adminDb.collection('users');
  const querySnapshot = await usersRef.where('username', '==', username).limit(1).get();
  return querySnapshot.empty;
}

function generateUsernameCandidate(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}_${noun}`; 
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken?.toString();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;
    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (!decodedToken.auth_time || nowInSeconds - decodedToken.auth_time > RECENT_SIGN_IN_WINDOW_SECONDS) {
      return NextResponse.json(
        { error: 'Recent sign-in required before creating a session.' },
        { status: 401 }
      );
    }

    try {
      const userDocRef = adminDb.collection('users').doc(uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        let username: string | null = null;
        let attempts = 0;

        while (!username && attempts < MAX_USERNAME_GENERATION_ATTEMPTS) {
          attempts++;
          let candidate = generateUsernameCandidate();

          if (attempts > 1) {
             let numDigits: number;
             if (attempts === 2) {
                 numDigits = 2;
             } else if (attempts === 3) {
                 numDigits = 3;
             } else {
                 numDigits = 4;
             }
             
             const min = Math.pow(10, numDigits - 1);
             const max = Math.pow(10, numDigits) - 1;
             const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
             const suffix = `_${randomNumber}`;
             
             const baseLength = MAX_USERNAME_LENGTH - suffix.length;
             if (candidate.length > baseLength) {
                 candidate = candidate.substring(0, Math.max(0, baseLength)); 
             }
             candidate += suffix;
          } else {
             if (candidate.length > MAX_USERNAME_LENGTH) {
                 candidate = candidate.substring(0, MAX_USERNAME_LENGTH);
             }
          }

          candidate = candidate.toLowerCase().replace(/[^a-z0-9_]/g, ''); 
          if (candidate.length < 3) continue; 

          if (await isUsernameAvailable(candidate)) {
            username = candidate;
          }
        }

        if (!username) {
          console.warn(`[API Session Login] Failed to generate unique username after ${MAX_USERNAME_GENERATION_ATTEMPTS} attempts. Falling back to user_UID format.`);
          const fallbackBase = `user_${uid.substring(0, 8)}`; 
          username = fallbackBase.substring(0, MAX_USERNAME_LENGTH); 

          if (!(await isUsernameAvailable(username))) {
             console.error(`[API Session Login] Fallback username '${username}' is also taken. Critical error.`);
             return NextResponse.json({ error: 'Failed to assign a unique username.' }, { status: 500 });
          }
        }

        const newUserDocument = {
          uid: uid,
          email: email || null,
          username: username,
          photoURL: decodedToken.picture || null, 
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };
        await userDocRef.set(newUserDocument);
      }
    } catch (dbError) {
      console.error(`[API Session Login] Error checking/creating user document for UID: ${uid}`, dbError);
      return NextResponse.json({ error: 'Failed to initialize user data.' }, { status: 500 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

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
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string };
      if (firebaseError.code === 'auth/invalid-id-token' || firebaseError.code === 'auth/id-token-expired') {
         return NextResponse.json({ error: 'Invalid or expired ID token.' }, { status: 401 });
      }
    }
    return NextResponse.json({ error: 'Failed to create session cookie. Unknown error occurred.' }, { status: 500 });
  }
}
