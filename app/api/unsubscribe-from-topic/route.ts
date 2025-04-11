// app/api/unsubscribe-from-topic/route.ts
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
    
    const topic = body.topic;
    
    if (!topic || !topic.startsWith('user_')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid topic format. Only user-specific topics are allowed.' 
      }, { status: 400 });
    }
    
    await admin.messaging().unsubscribeFromTopic([token], topic);
    return NextResponse.json({ 
      success: true, 
      message: `Unsubscribed from "${topic}" topic` 
    });
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to unsubscribe from topic' 
    }, { status: 500 });
  }
}
