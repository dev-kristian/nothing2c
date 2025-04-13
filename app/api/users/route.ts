import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';

interface UserProfile {
  uid: string;
  email: string;
  createdAt: FirebaseFirestore.Timestamp;
  
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

    

    if (!userDoc.exists) {
      const newUserProfile: UserProfile = {
        uid: uid,
        email: email,
        createdAt: Timestamp.fromDate(new Date()),
        
      };
      await userRef.set(newUserProfile);
      
    } else {
      
    }

    
    
    return NextResponse.json({ status: 'success', uid: uid }); 

  } catch (error) {
    console.error('Error in /api/users POST handler:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
