import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Add adminDb back
import { cookies } from 'next/headers';

export async function GET() {
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    if (!decodedClaims.email_verified) {
      console.log(`[API Verify Session] User ${decodedClaims.uid} email not verified.`);
      const response = NextResponse.json({ isAuthenticated: false, reason: 'email_not_verified' }, { status: 401 });
      return response;
    }

    let setupCompleted: boolean;
    const hasUsername = decodedClaims.hasUsername === true; // Keep checking this claim if needed

    // Check if the specific claim exists in the decoded token
    if (typeof decodedClaims.setupCompleted === 'boolean') {
      // Claim exists, use its value
      setupCompleted = decodedClaims.setupCompleted;
    } else {
      // Claim MISSING - this is an old cookie or user state.
      // Fetch from Firestore as a fallback for this transition period.
      console.warn(`[API Verify Session] setupCompleted claim missing for UID: ${decodedClaims.uid}. Fetching from Firestore.`);
      try {
        const userDocRef = adminDb.collection('users').doc(decodedClaims.uid);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
          setupCompleted = userDoc.data()?.setupCompleted === true;
        } else {
          console.warn(`[API Verify Session] User document not found for UID: ${decodedClaims.uid} during fallback check.`);
          setupCompleted = false; // Assume false if doc doesn't exist
        }
        // Proactively set the claim on the user object for future token refreshes/session logins.
        // This helps migrate users to the new system over time.
        await adminAuth.setCustomUserClaims(decodedClaims.uid, { setupCompleted });
        console.log(`[API Verify Session] Proactively set setupCompleted claim for UID: ${decodedClaims.uid}`);
      } catch (dbError) {
        console.error(`[API Verify Session] Error during fallback check/claim set for UID: ${decodedClaims.uid}`, dbError);
        setupCompleted = false; // Default to false on error during fallback
      }
    }

    // Return status based on determined setupCompleted value
    return NextResponse.json({
      isAuthenticated: true,
      uid: decodedClaims.uid,
      setupCompleted: setupCompleted,
      hasUsername: hasUsername
    }, { status: 200 });

  } catch (error: unknown) {
    let errorMessage = 'Unknown error verifying session cookie';
    let errorCode: string | undefined;
    if (error instanceof Error) {
      errorMessage = error.message;
      if (typeof error === 'object' && error !== null && 'code' in error) {
        errorCode = (error as { code: string }).code;
      }
    }
    console.error('[API Verify Session] Error verifying session cookie:', errorCode || errorMessage);
    const response = NextResponse.json({ isAuthenticated: false }, { status: 401 });
    response.cookies.set('__session', '', { maxAge: 0, path: '/' }); 
    return response;
  }
}
