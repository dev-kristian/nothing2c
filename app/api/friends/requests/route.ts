// app/api/friends/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
    
    const requests = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamp to ISO string
        timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString()
      };
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error getting friend requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend requests' },
      { status: 500 }
    );
  }
}
