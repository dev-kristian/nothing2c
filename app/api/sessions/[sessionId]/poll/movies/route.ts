import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin'; // Import admin for FieldValue
import { Session, MediaPollItem } from '@/types'; // Import MediaPollItem and Poll
import { FieldValue } from 'firebase-admin/firestore';

// New validation function for the MediaPollItem structure
const isValidMediaPollItemInput = (data: unknown): data is MediaPollItem => {
  if (typeof data !== 'object' || data === null) return false;
  const item = data as Partial<MediaPollItem>; // Use Partial for type checking
  return (
    typeof item.id === 'number' &&
    (item.type === 'movie' || item.type === 'tv') &&
    typeof item.title === 'string' && item.title.trim() !== '' &&
    (item.poster_path === null || typeof item.poster_path === 'string') &&
    (item.release_date === null || typeof item.release_date === 'string') && // Allow null or string
    (item.vote_average === null || typeof item.vote_average === 'number') // Allow null or number
  );
};

// Validation for DELETE request body
const isValidDeleteInput = (data: unknown): data is { mediaId: number } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'mediaId' in data &&
    typeof (data as { mediaId: unknown }).mediaId === 'number'
  );
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile || !userProfile.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userProfile.uid;

    const sessionRef = adminDb.doc(`sessions/${sessionId}`);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data() as Session | undefined;

    // Check if Session is Completed
    if (sessionData?.status === 'completed') {
      return NextResponse.json({ error: 'Cannot add movies to a completed session poll' }, { status: 403 }); // Forbidden
    }

    const participantInfo = sessionData?.participants?.[userId];

    if (!participantInfo) {
      console.warn(`User ${userId} attempted to add movie to poll for session ${sessionId} they are not part of.`);
      return NextResponse.json({ error: 'Forbidden: User is not a participant' }, { status: 403 });
    }

    if (participantInfo.status !== 'accepted') {
      console.warn(`User ${userId} attempted to add movie to poll for session ${sessionId} with status '${participantInfo.status}'.`);
      return NextResponse.json({ error: 'Forbidden: User must accept the invitation before suggesting movies.' }, { status: 403 });
    }

    let mediaItem: MediaPollItem;
    try {
      const body = await request.json();
      if (!isValidMediaPollItemInput(body)) {
        console.error("Invalid media item input:", body);
        return NextResponse.json({ error: 'Invalid input data: requires id, type, title, poster_path, release_date, vote_average.' }, { status: 400 });
      }
      mediaItem = body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Use a transaction to handle poll creation/update atomically
    await adminDb.runTransaction(async (transaction) => {
      const freshSessionDoc = await transaction.get(sessionRef);
      if (!freshSessionDoc.exists) {
        throw new Error("Session not found during transaction"); // Should not happen based on earlier check, but good practice
      }
      const freshSessionData = freshSessionDoc.data() as Session | undefined;

      if (!freshSessionData?.poll) {
        // Poll doesn't exist, create it with the first media item
        transaction.update(sessionRef, {
          poll: {
            mediaItems: [mediaItem], // Use mediaItems array
            votes: {} // Initialize votes map
          }
        });
      } else {
        // Poll exists, add media item if its ID is not already present
        const existingIds = freshSessionData.poll.mediaItems.map(item => item.id);
        if (existingIds.includes(mediaItem.id)) {
          // Item already exists, return conflict status but don't throw error in transaction
          // We'll handle the response outside the transaction based on a flag or similar
          // For now, just log and don't update
          console.log(`Media item with ID ${mediaItem.id} already exists in poll for session ${sessionId}.`);
          // To signal conflict, we could set a variable checked outside transaction
          // Or simply let the transaction succeed without changes if item exists
        } else {
          transaction.update(sessionRef, {
            'poll.mediaItems': FieldValue.arrayUnion(mediaItem) // Add the whole object
          });
        }
      }
    });

    // Re-fetch session data after transaction to check if item was actually added (or existed before)
    const updatedSessionDoc = await sessionRef.get();
    const updatedSessionData = updatedSessionDoc.data() as Session | undefined;
    const itemExists = updatedSessionData?.poll?.mediaItems.some(item => item.id === mediaItem.id);

    if (!itemExists) {
        // This case should ideally not happen if transaction logic is correct
        console.error(`[${sessionId}] Failed to add/verify media item ${mediaItem.id} after transaction.`);
        return NextResponse.json({ error: 'Failed to add media item, possibly due to concurrent update.' }, { status: 500 });
    }

    // Check if the item was newly added or already existed
    // This requires comparing lengths or checking existence before transaction, which adds complexity.
    // Let's assume success means it's now present. If it existed before, it's still a "success" in idempotency terms.
    // A 409 Conflict might be more appropriate if it already existed. Let's refine this:

    // --- Refined Logic for Conflict ---
    const sessionBeforeUpdate = sessionDoc.data() as Session | undefined;
    const alreadyExisted = sessionBeforeUpdate?.poll?.mediaItems.some(item => item.id === mediaItem.id) ?? false;

    if (alreadyExisted) {
         return NextResponse.json({ message: 'Media item already exists in the poll' }, { status: 200 }); // Or 409 if preferred
    } else {
         return NextResponse.json({ message: 'Media item added to poll successfully' }, { status: 200 }); // Or 201 Created
    }

  } catch (error: unknown) {
    console.error(`Error adding movie to poll for session ${sessionId} via API:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`Firestore Error Code: ${(error as { code: string }).code}`);
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    }
    return NextResponse.json({ error: 'Failed to add movie to poll' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile || !userProfile.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userProfile.uid;

    const sessionRef = adminDb.doc(`sessions/${sessionId}`);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data() as Session | undefined;

    // Check if Session is Completed or Active
    if (sessionData?.status !== 'active') {
       return NextResponse.json({ error: `Cannot modify poll for session with status: ${sessionData?.status}` }, { status: 403 });
    }

    const participantInfo = sessionData?.participants?.[userId];

    if (!participantInfo) {
      console.warn(`User ${userId} attempted to remove movie from poll for session ${sessionId} they are not part of.`);
      return NextResponse.json({ error: 'Forbidden: User is not a participant' }, { status: 403 });
    }

    if (participantInfo.status !== 'accepted') {
      console.warn(`User ${userId} attempted to remove movie from poll for session ${sessionId} with status '${participantInfo.status}'.`);
      return NextResponse.json({ error: 'Forbidden: User must accept the invitation before removing movies.' }, { status: 403 });
    }

    const pollData = sessionData?.poll; // Use the updated Poll type

    if (!pollData || !pollData.mediaItems || pollData.mediaItems.length === 0) {
        return NextResponse.json({ error: 'Poll does not exist or is empty for this session' }, { status: 404 });
    }

    let mediaIdToRemove: number;
    try {
      const body = await request.json();
      if (!isValidDeleteInput(body)) {
        return NextResponse.json({ error: 'Invalid input data: mediaId must be a number.' }, { status: 400 });
      }
      mediaIdToRemove = body.mediaId;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const itemToRemove = pollData.mediaItems.find(item => item.id === mediaIdToRemove);

    if (!itemToRemove) {
        return NextResponse.json({ error: 'Media item not found in the poll' }, { status: 404 });
    }

    // Use transaction to remove item and update votes
    await adminDb.runTransaction(async (transaction) => {
        const freshSessionDoc = await transaction.get(sessionRef);
        const freshSessionData = freshSessionDoc.data() as Session | undefined;
        const freshPollData = freshSessionData?.poll;

        if (!freshPollData || !freshPollData.mediaItems) {
            // Poll or items disappeared, maybe log this?
            console.warn(`[${sessionId}] Poll or media items disappeared during DELETE transaction for item ${mediaIdToRemove}.`);
            return; // Exit transaction
        }

        const currentItemToRemove = freshPollData.mediaItems.find(item => item.id === mediaIdToRemove);
        if (!currentItemToRemove) {
            console.warn(`[${sessionId}] Media item ${mediaIdToRemove} was already removed before DELETE transaction completed.`);
            return; // Item already gone
        }

        // Prepare updates
        const updates: { [key: string]: FieldValue } = {
            'poll.mediaItems': FieldValue.arrayRemove(currentItemToRemove) // Remove the specific object
        };

        // Remove votes for this mediaId from all users
        if (freshPollData.votes) {
            for (const voterId in freshPollData.votes) {
                const userVotes = freshPollData.votes[voterId];
                if (userVotes.includes(mediaIdToRemove)) {
                    // Use FieldValue.arrayRemove to remove the ID from the user's vote array
                    updates[`poll.votes.${voterId}`] = FieldValue.arrayRemove(mediaIdToRemove);
                }
            }
        }

        transaction.update(sessionRef, updates);
    });


    return NextResponse.json({ message: 'Media item removed from poll successfully' }, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error removing movie from poll for session ${sessionId} via API:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`Firestore Error Code: ${(error as { code: string }).code}`);
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    }
    return NextResponse.json({ error: 'Failed to remove movie from poll' }, { status: 500 });
  }
}
