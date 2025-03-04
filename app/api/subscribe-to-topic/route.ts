// app/api/subscribe-to-topic/route.ts
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PRIVATE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.NEXT_PRIVATE_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.NEXT_PRIVATE_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token is required' 
      }, { status: 400 });
    }
    
    // Get user ID from the request or from authentication
    let topic = body.topic;
    
    // Safety check: Only allow user-specific topics
    if (!topic || !topic.startsWith('user_')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid topic format. Only user-specific topics are allowed.' 
      }, { status: 400 });
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
