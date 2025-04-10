import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { adjectives, nouns } from '@/constants/usernameParts'; // Import word lists

const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
const MAX_USERNAME_GENERATION_ATTEMPTS = 10;
const MAX_USERNAME_LENGTH = 20; // Increased max length

// Helper function to check username availability
async function isUsernameAvailable(username: string): Promise<boolean> {
  const usersRef = adminDb.collection('users');
  const querySnapshot = await usersRef.where('username', '==', username).limit(1).get();
  return querySnapshot.empty;
}

// Helper function to generate a username candidate
function generateUsernameCandidate(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  // Simple combination, ensure it fits length later
  return `${adj}_${noun}`; 
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body.idToken?.toString();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    // 1. Verify ID token to get UID and email
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email; // Get email from token

    // 2. Ensure user document exists in Firestore (Create if not)
    try {
      const userDocRef = adminDb.collection('users').doc(uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        console.log(`[API Session Login] User document not found for UID: ${uid}. Attempting to generate unique username.`);
        let username: string | null = null;
        let attempts = 0;

        while (!username && attempts < MAX_USERNAME_GENERATION_ATTEMPTS) {
          attempts++;
          let candidate = generateUsernameCandidate();

          // Append random numbers on subsequent attempts if needed, varying the number of digits
          if (attempts > 1) {
             let numDigits: number;
             if (attempts === 2) {
                 numDigits = 2; // Attempt 2: ##
             } else if (attempts === 3) {
                 numDigits = 3; // Attempt 3: ###
             } else {
                 numDigits = 4; // Attempts 4+: ####
             }
             
             const min = Math.pow(10, numDigits - 1);
             const max = Math.pow(10, numDigits) - 1;
             const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
             const suffix = `_${randomNumber}`;
             
             const baseLength = MAX_USERNAME_LENGTH - suffix.length;
             if (candidate.length > baseLength) {
                 // Ensure baseLength is not negative if suffix is too long
                 candidate = candidate.substring(0, Math.max(0, baseLength)); 
             }
             candidate += suffix;
          } else {
             // Ensure initial candidate fits length (Attempt 1)
             if (candidate.length > MAX_USERNAME_LENGTH) {
                 candidate = candidate.substring(0, MAX_USERNAME_LENGTH);
             }
          }

          // Basic validation (lowercase, chars) - lists should be pre-filtered mostly
          candidate = candidate.toLowerCase().replace(/[^a-z0-9_]/g, ''); 
          if (candidate.length < 3) continue; // Skip if too short after filtering/truncation

          console.log(`[API Session Login] Attempt ${attempts}: Checking availability for username: ${candidate}`);
          if (await isUsernameAvailable(candidate)) {
            username = candidate;
            console.log(`[API Session Login] Username '${username}' is available.`);
          }
        }

        // Fallback if unique name generation failed after max attempts
        if (!username) {
          console.warn(`[API Session Login] Failed to generate unique username after ${MAX_USERNAME_GENERATION_ATTEMPTS} attempts. Falling back to user_UID format.`);
          // Construct fallback ensuring it also respects MAX_USERNAME_LENGTH
          const fallbackBase = `user_${uid.substring(0, 8)}`; 
          username = fallbackBase.substring(0, MAX_USERNAME_LENGTH); 

          // Ensure fallback is also checked, though collision is extremely unlikely
          if (!(await isUsernameAvailable(username))) {
             console.error(`[API Session Login] Fallback username '${username}' is also taken. Critical error.`);
             // Handle this critical error - maybe return 500
             return NextResponse.json({ error: 'Failed to assign a unique username.' }, { status: 500 });
          }
        }

        const newUserDocument = {
          uid: uid,
          email: email || null, // Use email from token, fallback to null
          username: username,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(), // Also set updatedAt on creation
          // Removed redundant watchlist initialization (handled in separate collection)
          // No setupCompleted field needed anymore
        };
        await userDocRef.set(newUserDocument);
        console.log(`[API Session Login] Successfully created user document for UID: ${uid}`);
      }
    } catch (dbError) {
      console.error(`[API Session Login] Error checking/creating user document for UID: ${uid}`, dbError);
      // If document creation fails, we should probably stop the login process
      return NextResponse.json({ error: 'Failed to initialize user data.' }, { status: 500 });
    }

    // 3. Create session cookie (No custom claims needed anymore)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // 4. Set cookie options
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
