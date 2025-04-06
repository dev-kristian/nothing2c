import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Assuming you have firebase-admin initialized
import { DecodedIdToken } from 'firebase-admin/auth';

// Define the structure of your user profile in Firestore
interface UserProfile {
  uid: string;
  email: string;
  createdAt: FirebaseFirestore.Timestamp;
  profileCompleted: boolean;
  // Add other profile fields as needed (e.g., displayName, photoURL)
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const { uid, email } = await request.json();

    // Ensure the UID from the token matches the UID in the request body
    if (decodedToken.uid !== uid) {
      console.error(`Token UID (${decodedToken.uid}) does not match request UID (${uid})`);
      return NextResponse.json({ error: 'Unauthorized: UID mismatch' }, { status: 401 });
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    let profileCompleted = false;

    if (!userDoc.exists) {
      // User profile doesn't exist, create it
      console.log(`Creating new user profile for UID: ${uid}`);
      const newUserProfile: UserProfile = {
        uid: uid,
        email: email, // Use email from the request body (verified by token)
        createdAt: new Date() as any, // Firestore handles Timestamp conversion
        profileCompleted: false, // Default to false, user might need to complete it
        // Initialize other fields as needed
      };
      await userRef.set(newUserProfile);
      profileCompleted = newUserProfile.profileCompleted;
    } else {
      // User profile exists, check its completion status
      const existingProfile = userDoc.data() as UserProfile;
      profileCompleted = existingProfile.profileCompleted ?? false; // Use existing value or default to false
      console.log(`User profile found for UID: ${uid}, profileCompleted: ${profileCompleted}`);
    }

    // Return the completion status
    return NextResponse.json({ profileCompleted });

  } catch (error) {
    console.error('Error in /api/users POST handler:', error);
    // Avoid sending detailed internal errors to the client
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
