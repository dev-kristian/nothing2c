import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin'; 
import { DecodedIdToken } from 'firebase-admin/auth';

interface UserProfile {
  uid: string;
  email: string;
  createdAt: FirebaseFirestore.Timestamp;
  setupCompleted: boolean; // Renamed field
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

    if (decodedToken.uid !== uid) {
      console.error(`Token UID (${decodedToken.uid}) does not match request UID (${uid})`);
      return NextResponse.json({ error: 'Unauthorized: UID mismatch' }, { status: 401 });
    }

    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    let setupCompleted = false; // Renamed variable

    if (!userDoc.exists) {
      console.log(`Creating new user profile for UID: ${uid}`);
      const newUserProfile: UserProfile = {
        uid: uid,
        email: email,
        createdAt: new Date() as any,
        setupCompleted: false, // Renamed field
      };
      await userRef.set(newUserProfile);
      setupCompleted = newUserProfile.setupCompleted; // Renamed field
    } else {
      const existingProfile = userDoc.data() as UserProfile;
      setupCompleted = existingProfile.setupCompleted ?? false; // Renamed field
      console.log(`User profile found for UID: ${uid}, setupCompleted: ${setupCompleted}`); // Renamed field
    }

    return NextResponse.json({ setupCompleted }); // Renamed field

  } catch (error) {
    console.error('Error in /api/users POST handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
