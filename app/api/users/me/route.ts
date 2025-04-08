import { NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';
import { UserData } from '@/types'; 
import { Timestamp } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDocRef = adminDb.collection('users').doc(userProfile.uid);
    const watchlistDocRef = adminDb.collection('watchlists').doc(userProfile.uid);

    let userData: UserData | null = null;
    let userDocSnapshot = await userDocRef.get();

    if (!userDocSnapshot.exists) {
      console.log(`Creating default user document for UID: ${userProfile.uid}`);
      const defaultUserData: Omit<UserData, 'watchlist'> = { 
        username: userProfile.username || '',
        email: userProfile.email || undefined,
        createdAt: Timestamp.now().toDate(),
        updatedAt: Timestamp.now().toDate(),
        setupCompleted: false,
        uid: userProfile.uid,
      };
      await userDocRef.set(defaultUserData);
      userDocSnapshot = await userDocRef.get();
      const watchlistSnap = await watchlistDocRef.get();
      if (!watchlistSnap.exists) {
        console.log(`Creating default watchlist document for UID: ${userProfile.uid}`);
        await watchlistDocRef.set({ movie: {}, tv: {} }); 
      }
    }

    const userInfo = userDocSnapshot.data();
    const watchlistSnapshot = await watchlistDocRef.get();
    const watchlistData = watchlistSnapshot.exists ? watchlistSnapshot.data() : { movie: {}, tv: {} }; 

    if (userInfo) {
      userData = {
        username: userInfo.username,
        email: userInfo.email,
        createdAt: userInfo.createdAt?.toDate(),
        updatedAt: userInfo.updatedAt?.toDate(), 
        setupCompleted: userInfo.setupCompleted,
        uid: userInfo.uid,
        notification: userInfo.notification,
        watchlist: { 
          movie: watchlistData?.movie || {},
          tv: watchlistData?.tv || {}
        }
      } as UserData; 
    }

    if (!userData) {
        return NextResponse.json({ error: 'Failed to retrieve or create user data' }, { status: 500 });
    }

    return NextResponse.json(userData, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
