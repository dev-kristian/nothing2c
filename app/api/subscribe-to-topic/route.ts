
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils'; 


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
     
     console.error("Firebase Admin Init Error at top level (subscribe-to-topic):", initError);
  }
}

export async function POST(request: Request) {
  try {
    
    if (!admin.apps.length) {
        console.error("Firebase Admin SDK not initialized. Cannot process subscribe-to-topic request.");
        return NextResponse.json({ success: false, error: 'Internal Server Error (Admin Init)' }, { status: 500 });
    }
    

    
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authenticatedUserId = userProfile.uid;
    

    const body = await request.json();
    const { token, topic } = body; 

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token is required'
      }, { status: 400 });
    }

    
    if (!topic || !topic.startsWith('user_')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid topic format.'
      }, { status: 400 });
    }

    const targetUid = topic.substring(5); 
    if (authenticatedUserId !== targetUid) {
      console.warn(`Forbidden attempt: User ${authenticatedUserId} tried to subscribe to topic ${topic}`);
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Cannot subscribe to another user\'s topic'
      }, { status: 403 });
    }
    

    await admin.messaging().subscribeToTopic([token], topic);

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
