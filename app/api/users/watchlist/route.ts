import { NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';
import { Media } from '@/types';
import { FieldValue, Timestamp } from 'firebase-admin/firestore'; 

interface WatchlistData {
  movie: (Media & { addedAt?: Timestamp })[];
  tv: (Media & { addedAt?: Timestamp })[];
}

const getWatchlistDocRef = (uid: string) =>
  adminDb.collection('watchlists').doc(uid);

export async function GET() {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const watchlistDocRef = getWatchlistDocRef(userProfile.uid);
    const docSnap = await watchlistDocRef.get();

    if (!docSnap.exists) {
      await watchlistDocRef.set({ movie: [], tv: [] });
      return NextResponse.json({ movie: [], tv: [] }, { status: 200 });
    }

    const data = docSnap.data() as Partial<WatchlistData>;
    return NextResponse.json({
        movie: data.movie || [],
        tv: data.tv || []
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { item, mediaType } = body;

    if (!item || !item.id || !['movie', 'tv'].includes(mediaType)) {
      return NextResponse.json({ error: 'Invalid request body. Requires item (with id) and mediaType ("movie" or "tv").' }, { status: 400 });
    }

    const watchlistDocRef = getWatchlistDocRef(userProfile.uid);
    const itemToAdd = {
      ...item,
      addedAt: Timestamp.now()
    };

    await watchlistDocRef.update({
      [mediaType]: FieldValue.arrayUnion(itemToAdd)
    });

    return NextResponse.json({ message: 'Item added to watchlist' }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error adding to watchlist:', error);
     if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const mediaType = searchParams.get('mediaType');

    if (!id || !mediaType || !['movie', 'tv'].includes(mediaType)) {
      return NextResponse.json({ error: 'Missing or invalid query parameters. Requires id and mediaType ("movie" or "tv").' }, { status: 400 });
    }

    const watchlistDocRef = getWatchlistDocRef(userProfile.uid);
    const numericId = parseInt(id, 10);

    const docSnap = await watchlistDocRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
    }

    const data = docSnap.data() as Partial<WatchlistData>;
    const currentArray: (Media & { addedAt?: Timestamp })[] = (mediaType === 'movie' ? data.movie : data.tv) || [];

    const itemToRemove = currentArray.find((item: Media & { addedAt?: Timestamp }) => item.id === numericId);

    if (!itemToRemove) {
      console.warn(`Item with ID ${id} not found in ${mediaType} watchlist for user ${userProfile.uid}`);
      return NextResponse.json({ message: 'Item not found in watchlist or already removed' }, { status: 200 }); 
    }

    await watchlistDocRef.update({
      [mediaType]: FieldValue.arrayRemove(itemToRemove)
    });

    return NextResponse.json({ message: 'Item removed from watchlist' }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
