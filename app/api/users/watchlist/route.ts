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

    // Explicitly construct the object to add, based on Media type + addedAt
    const itemToAdd: Media & { addedAt: Timestamp } = {
      id: item.id,
      vote_average: item.vote_average,
      // Optional fields from Media type
      ...(item.title && { title: item.title }),
      ...(item.name && { name: item.name }),
      ...(item.poster_path && { poster_path: item.poster_path }),
      ...(item.overview && { overview: item.overview }),
      ...(item.genre_ids && { genre_ids: item.genre_ids }),
      ...(item.release_date && { release_date: item.release_date }),
      ...(item.first_air_date && { first_air_date: item.first_air_date }),
      // Add media_type and server-side timestamp
      media_type: mediaType, // Ensure media_type is saved
      addedAt: Timestamp.now(),
    };

    // Clean the object just in case any undefined values slipped through
    Object.keys(itemToAdd).forEach(key => {
      if (itemToAdd[key as keyof typeof itemToAdd] === undefined) {
        delete itemToAdd[key as keyof typeof itemToAdd];
      }
    });


    const watchlistDocRef = getWatchlistDocRef(userProfile.uid);
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
      // Item not found, but return success as the state is effectively 'removed'
      return NextResponse.json({ message: 'Item not found in watchlist or already removed' }, { status: 200 });
    }

    // Filter the array manually to remove the item by ID
    const filteredArray = currentArray.filter((item: Media & { addedAt?: Timestamp }) => item.id !== numericId);

    // Update the document with the filtered array
    await watchlistDocRef.update({
      [mediaType]: filteredArray
    });

    return NextResponse.json({ message: 'Item removed from watchlist' }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
