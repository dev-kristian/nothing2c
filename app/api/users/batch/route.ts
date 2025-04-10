import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils'; // Keep auth check

interface BatchRequest {
  uids?: string[];
}

interface UserBatchDetails {
  uid: string;
  username?: string;
  photoURL?: string;
}

export async function POST(request: NextRequest) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BatchRequest = await request.json();
    const uids = body.uids;

    if (!Array.isArray(uids) || uids.length === 0) {
      return NextResponse.json({ error: 'Invalid input: uids array is required.' }, { status: 400 });
    }

    const uniqueUids = Array.from( 
        new Set(uids.filter(uid => typeof uid === 'string' && uid.length > 0))
    );

    if (uniqueUids.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const userDetailsMap = new Map<string, UserBatchDetails>();
    const MAX_IN_QUERY_SIZE = 30;
    const uidChunks: string[][] = [];
    for (let i = 0; i < uniqueUids.length; i += MAX_IN_QUERY_SIZE) {
      uidChunks.push(uniqueUids.slice(i, i + MAX_IN_QUERY_SIZE));
    }

    const userDetailsPromises = uidChunks.map(async (chunk) => {
      if (chunk.length === 0) return;
      const usersRef = collection(db, 'users');
      const qUsers = query(usersRef, where(documentId(), 'in', chunk));
      const userSnapshot = await getDocs(qUsers);
      userSnapshot.docs.forEach(doc => {
        const data = doc.data();
        userDetailsMap.set(doc.id, {
          uid: doc.id,
          username: data.username,
          photoURL: data.photoURL,
        });
      });
    });
    await Promise.all(userDetailsPromises);

    const users: UserBatchDetails[] = uniqueUids.map(uid =>
        userDetailsMap.get(uid) || { uid: uid }
    );


    return NextResponse.json({ users });

  } catch (error: unknown) {
    console.error('Error fetching batch user details:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch batch user details' },
      { status: 500 }
    );
  }
}
