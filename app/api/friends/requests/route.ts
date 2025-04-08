import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; 

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const requestsRef = collection(db, 'users', userId, 'friendRequests');
    const q = query(requestsRef, where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);

    const requestsPromises = querySnapshot.docs.map(async (requestDoc) => {
      const data = requestDoc.data();
      const fromUid = data.fromUid;
      let exists = true;
      let fromUsername = data.fromUsername;

      if (fromUid) {
        const userDocRef = doc(db, 'users', fromUid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          exists = false;
          fromUsername = "unknown user";
        }
      } else {
        exists = false;
        fromUsername = "unknown user";
      }

      return {
        id: requestDoc.id,
        fromUid: fromUid || null, 
        fromUsername: fromUsername,
        status: data.status,
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
        exists: exists,
      };
    });

    const requests = await Promise.all(requestsPromises);

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error getting friend requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend requests' },
      { status: 500 }
    );
  }
}
