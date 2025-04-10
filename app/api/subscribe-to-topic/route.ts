// app/api/subscribe-to-topic/route.ts
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils'; // Import auth utility

// Keep local initialization as admin.messaging() is used directly
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PRIVATE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.NEXT_PRIVATE_FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.NEXT_PRIVATE_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (initError) {
     // Log error but don't return here, check inside POST handler
     console.error("Firebase Admin Init Error at top level (subscribe-to-topic):", initError);
  }
}

export async function POST(request: Request) {
  try {
    // --- Check Admin SDK Initialization ---
    if (!admin.apps.length) {
        console.error("Firebase Admin SDK not initialized. Cannot process subscribe-to-topic request.");
        return NextResponse.json({ success: false, error: 'Internal Server Error (Admin Init)' }, { status: 500 });
    }
    // --- End Check ---

    // --- Authentication ---
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authenticatedUserId = userProfile.uid;
    // --- End Authentication ---

    const body = await request.json();
    const { token, topic } = body; // Destructure topic here

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token is required'
      }, { status: 400 });
    }

    // --- Authorization ---
    if (!topic || !topic.startsWith('user_')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid topic format.'
      }, { status: 400 });
    }

    const targetUid = topic.substring(5); // Extract UID from topic
    if (authenticatedUserId !== targetUid) {
      console.warn(`Forbidden attempt: User ${authenticatedUserId} tried to subscribe to topic ${topic}`);
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Cannot subscribe to another user\'s topic'
      }, { status: 403 });
    }
    // --- End Authorization ---

    await admin.messaging().subscribeToTopic([token], topic);

    console.log(`User ${authenticatedUserId} successfully subscribed token to topic ${topic}`);
    return NextResponse.json({
      success: true,
      message: `Subscribed to "${topic}" topic`
    });
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to subscribe to topic' 
    }, { status: 500 });
  }
}
