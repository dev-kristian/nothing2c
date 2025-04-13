import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import {  UserProfile } from '@/types'; 
import { FieldValue, CollectionReference } from 'firebase-admin/firestore'; 
import { checkUsernameAvailability } from '@/app/actions/userActions';

import { DocumentReference } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

async function deleteCollectionRecursive(
    collectionRef: CollectionReference,
    batchSize: number = 10
): Promise<void> {
    let query = collectionRef.limit(batchSize);

    while (true) {
        const snapshot = await query.get();
        if (snapshot.size === 0) {
            break; 
        }

        const batch = adminDb.batch();
        const deletePromises: Promise<void>[] = [];

        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);

            deletePromises.push(deleteSubcollectionsRecursive(doc.ref, batchSize));
        });

        await batch.commit();

        await Promise.all(deletePromises);

        if (snapshot.size < batchSize) {
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
    const subcollections = await docRef.listCollections();
    if (subcollections.length > 0) {
        for (const subcollection of subcollections) {
            await deleteCollectionRecursive(subcollection, batchSize);
        }
    } else {
    }
}

export async function GET() {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDocRef = adminDb.collection('users').doc(userProfile.uid);

    let userProfileData: UserProfile | null = null; 
     const userDocSnapshot = await userDocRef.get();

     if (!userDocSnapshot.exists) {
        console.error(`User document not found for authenticated user UID: ${userProfile.uid}. This should not happen.`);
        return NextResponse.json({ error: 'User data not found despite valid authentication.' }, { status: 404 });
     }

     const userInfo = userDocSnapshot.data();

    if (userInfo) {
      userProfileData = {
        uid: userProfile.uid, 
        email: userProfile.email,
        username: userInfo.username || '', 
        photoURL: userInfo.photoURL || null,
        createdAt: userInfo.createdAt?.toDate?.().toISOString() || new Date(0).toISOString(),
        updatedAt: userInfo.updatedAt?.toDate?.().toISOString() || new Date(0).toISOString(),
      };
    }

    if (!userProfileData) {
        return NextResponse.json({ error: 'Failed to retrieve user profile data' }, { status: 500 });
    }

    return NextResponse.json(userProfileData, { status: 200 });

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

    const userDocRef = adminDb.collection('users').doc(uid);
    const watchlistDocRef = adminDb.collection('watchlists').doc(uid);
    const sessionsRef = adminDb.collection('sessions');

    try {
        const userSessionsQuery = sessionsRef
            .where('createdByUid', '==', uid)
            .where('status', '==', 'active'); 

        const activeSessionsSnapshot = await userSessionsQuery.get();
        if (!activeSessionsSnapshot.empty) {
            const sessionUpdateBatch = adminDb.batch();
            activeSessionsSnapshot.docs.forEach(doc => {
                sessionUpdateBatch.update(doc.ref, { 'status': 'completed' });
            });
            await sessionUpdateBatch.commit();
        } else {
        }
    } catch (sessionUpdateError) {
        console.error(`Error updating sessions for UID ${uid}:`, sessionUpdateError);
    }

    await deleteSubcollectionsRecursive(userDocRef, 100);


    const deleteDocsBatch = adminDb.batch();
    deleteDocsBatch.delete(userDocRef); 
    deleteDocsBatch.delete(watchlistDocRef);

    await deleteDocsBatch.commit();

    await adminAuth.deleteUser(uid);

    const cookieStore = cookies();
    cookieStore.delete('__session'); 

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

    return NextResponse.json({ message: 'Username updated successfully' }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating username:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
