// app/api/send-notification/route.ts
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils'; // Import auth utility
import { adminDb } from '@/lib/firebase-admin'; // Import adminDb

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
     console.error("Firebase Admin Init Error at top level (send-notification):", initError);
  }
}

export async function POST(request: Request) {
  try {
    // --- Check Admin SDK Initialization ---
    if (!admin.apps.length) {
        console.error("Firebase Admin SDK not initialized. Cannot process send-notification request.");
        return NextResponse.json({ success: false, error: 'Internal Server Error (Admin Init)' }, { status: 500 });
    }
    // --- End Check ---

    // --- Authentication ---
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authenticatedUserId = userProfile.uid; // This is the SENDER
    // --- End Authentication ---

    // Expect sessionId along with other notification details
    const { sessionId, title, body, icon, clickAction, recipients, ...otherFields } = await request.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No recipients specified'
      }, { status: 400 });
    }

    // --- Authorization ---
    if (!sessionId) {
        return NextResponse.json({ success: false, error: 'Session ID is required for authorization' }, { status: 400 });
    }

    try {
        const sessionDocRef = adminDb.doc(`sessions/${sessionId}`);
        const sessionDoc = await sessionDocRef.get();

        if (!sessionDoc.exists) {
            console.warn(`Authorization failed: Session ${sessionId} not found for user ${authenticatedUserId}`);
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const sessionData = sessionDoc.data();
        // Assuming sessionData.participants is a map like { uid: { role: 'host' | 'participant', ... } }
        // Adjust this check based on your actual session data structure
        const participants = sessionData?.participants || {};
        if (!participants[authenticatedUserId]) {
            console.warn(`Authorization failed: User ${authenticatedUserId} is not part of session ${sessionId}`);
            return NextResponse.json({ error: 'Forbidden: Sender is not part of the session' }, { status: 403 });
        }
    } catch (authError) {
        console.error(`Error during authorization check for session ${sessionId}, user ${authenticatedUserId}:`, authError);
        return NextResponse.json({ error: 'Internal Server Error (Authorization Check)' }, { status: 500 });
    }
    // --- End Authorization ---


    const MAX_RECIPIENTS = 50; // Keep recipient limit
    if (recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json({
        success: false,
        error: `Too many recipients. Maximum allowed is ${MAX_RECIPIENTS}.`
      }, { status: 400 });
    }

    // Filter out the sender from the recipients list
    const validRecipients = recipients.filter(uid => typeof uid === 'string' && uid && uid !== authenticatedUserId);

    if (validRecipients.length === 0) {
       console.log(`No valid recipients after filtering sender ${authenticatedUserId}`);
       // Return success as there's nothing to send, or adjust as needed
       return NextResponse.json({ success: true, message: 'No valid recipients to notify.' });
    }

    const notification = { title, body };
    const webpush = {
      notification: { icon, ...otherFields },
      fcmOptions: { link: clickAction },
    };

    const sendPromises = validRecipients.map(uid => {
      const topic = `user_${uid}`;
      const message = { notification, webpush, topic };

      return admin.messaging().send(message)
        .then(response => ({ uid, status: 'success', response }))
        .catch(error => {
          console.error(`Failed to send notification to ${topic} (User: ${uid}):`, error.code || error.message);
          // Optionally capture more error details
          return { uid, status: 'error', error: error.code || error.message };
        });
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.length - successCount;

    if (failureCount > 0) {
        console.warn(`Failed to send notifications to ${failureCount} recipients for session ${sessionId}.`);
        // Optionally log more details about failures if needed
    }

    return NextResponse.json({
      success: true, // Indicate overall operation attempt was processed
      message: `Attempted to send notifications. Success: ${successCount}/${validRecipients.length}. Failures: ${failureCount}.`
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send notification' 
    }, { status: 500 });
  }
}
