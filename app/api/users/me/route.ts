import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { UserData } from '@/types';
import { FieldValue, CollectionReference } from 'firebase-admin/firestore'; 
import { checkUsernameAvailability } from '@/app/actions/userActions';

import { DocumentReference } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

async function deleteCollectionRecursive(
    collectionRef: CollectionReference,
    batchSize: number = 10
): Promise<void> {
    console.log(`Recursively deleting collection: ${collectionRef.path}`);
    let query = collectionRef.limit(batchSize);

    while (true) {
        const snapshot = await query.get();
        if (snapshot.size === 0) {
            console.log(`No more documents found in ${collectionRef.path}.`);
            break; 
        }

        const batch = adminDb.batch();
        const deletePromises: Promise<void>[] = [];

        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            console.log(`Scheduled deletion for doc: ${doc.ref.path}`);

            deletePromises.push(deleteSubcollectionsRecursive(doc.ref, batchSize));
        });

        console.log(`Committing batch delete for ${snapshot.size} documents in ${collectionRef.path}...`);
        await batch.commit();
        console.log(`Batch delete committed for ${collectionRef.path}.`);

        await Promise.all(deletePromises);
        console.log(`Recursive subcollection deletions (if any) completed for this batch in ${collectionRef.path}.`);

        if (snapshot.size < batchSize) {
            console.log(`Finished deleting all documents in ${collectionRef.path}.`);
            break; 
        }

        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        query = collectionRef.startAfter(lastVisible).limit(batchSize);
    }
}

async function deleteSubcollectionsRecursive(
    docRef: DocumentReference,
    batchSize: number
): Promise<void> {
    console.log(`Checking for subcollections under doc: ${docRef.path}`);
    const subcollections = await docRef.listCollections();
    if (subcollections.length > 0) {
        console.log(`Found ${subcollections.length} subcollections under ${docRef.path}.`);
        for (const subcollection of subcollections) {
            await deleteCollectionRecursive(subcollection, batchSize);
        }
        console.log(`Finished deleting all subcollections under ${docRef.path}.`);
    } else {
         console.log(`No subcollections found under ${docRef.path}.`);
    }
}


export async function GET() {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDocRef = adminDb.collection('users').doc(userProfile.uid);
    // Removed watchlistDocRef

    let userData: UserData | null = null;
     const userDocSnapshot = await userDocRef.get();

     if (!userDocSnapshot.exists) {
        console.error(`User document not found for authenticated user UID: ${userProfile.uid}. This should not happen.`);
        return NextResponse.json({ error: 'User data not found despite valid authentication.' }, { status: 404 });
     }

     const userInfo = userDocSnapshot.data();
     // Removed watchlistSnapshot fetch and watchlistData definition

    if (userInfo) {
      // Construct UserData without fetching watchlist here
      // The client hook will merge the real-time watchlist data
      userData = {
        username: userInfo.username,
        email: userInfo.email,
        createdAt: userInfo.createdAt?.toDate(),
        updatedAt: userInfo.updatedAt?.toDate(),
        uid: userInfo.uid,
        notification: userInfo.notification,
        // Initialize watchlist as empty; client listener will populate it
        watchlist: {
          movie: [],
          tv: []
        }
      } as UserData; // Still assert as UserData, but watchlist part is just placeholder
    }

    if (!userData) {
        return NextResponse.json({ error: 'Failed to retrieve or create user data' }, { status: 500 });
    }

    return NextResponse.json(userData, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching user data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile) {
      console.error('DELETE /api/users/me: Unauthorized access attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = userProfile.uid;
    console.log(`Attempting to delete account for UID: ${uid}`);

    const userDocRef = adminDb.collection('users').doc(uid);
    const watchlistDocRef = adminDb.collection('watchlists').doc(uid);
    const sessionsRef = adminDb.collection('sessions');

    console.log(`Updating active sessions created by UID: ${uid}`);
    try {
        const userSessionsQuery = sessionsRef
            .where('createdByUid', '==', uid)
            .where('status', '==', 'active'); 

        const activeSessionsSnapshot = await userSessionsQuery.get();
        if (!activeSessionsSnapshot.empty) {
            const sessionUpdateBatch = adminDb.batch();
            activeSessionsSnapshot.docs.forEach(doc => {
                console.log(`Marking session ${doc.id} as completed.`);
                sessionUpdateBatch.update(doc.ref, { 'status': 'completed' });
            });
            await sessionUpdateBatch.commit();
            console.log(`Finished updating ${activeSessionsSnapshot.size} active sessions created by UID: ${uid}`);
        } else {
            console.log(`No active sessions found created by UID: ${uid} to update.`);
        }
    } catch (sessionUpdateError) {
        console.error(`Error updating sessions for UID ${uid}:`, sessionUpdateError);
    }

    console.log(`Starting recursive deletion of subcollections for user UID: ${uid}`);
    await deleteSubcollectionsRecursive(userDocRef, 100);
    console.log(`Finished recursive deletion of subcollections for user UID: ${uid}`);


    console.log(`Deleting top-level documents for UID: ${uid}`);
    const deleteDocsBatch = adminDb.batch();
    deleteDocsBatch.delete(userDocRef); 
    deleteDocsBatch.delete(watchlistDocRef);

    await deleteDocsBatch.commit();
    console.log(`Top-level Firestore documents deleted for UID: ${uid}`);

    await adminAuth.deleteUser(uid);
    console.log(`Firebase Auth user deleted for UID: ${uid}`);

    const cookieStore = cookies();
    cookieStore.delete('__session'); 
    console.log(`Session cookie cleared for UID: ${uid}`);

    return new NextResponse(null, { status: 204 });

  } catch (error: unknown) {
    console.error('Error deleting account:', error);
    let errorMessage = 'Failed to delete account.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newUsername } = await request.json();

    const validation = await checkUsernameAvailability(newUsername);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const finalUsername = newUsername.trim().toLowerCase();

    const userDocRef = adminDb.collection('users').doc(userProfile.uid);

    await userDocRef.update({
      username: finalUsername,
      updatedAt: FieldValue.serverTimestamp(), 
    });

    console.log(`Username updated successfully for UID: ${userProfile.uid}`);
    return NextResponse.json({ message: 'Username updated successfully' }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating username:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
