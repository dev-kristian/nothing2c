import { NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';

type NotificationStatus = 'allowed' | 'denied' | 'unsupported';

const isValidStatus = (status: unknown): status is NotificationStatus => {
  return ['allowed', 'denied', 'unsupported'].includes(status as string);
};

export async function PUT(request: Request) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!isValidStatus(status)) {
      return NextResponse.json({ error: 'Invalid notification status provided' }, { status: 400 });
    }

    const userDocRef = adminDb.collection('users').doc(userProfile.uid);

    await userDocRef.set({ notification: status }, { merge: true });

    return NextResponse.json({ message: 'Notification status updated successfully' }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating notification status:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
