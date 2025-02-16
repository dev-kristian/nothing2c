//app\api\subscribe-to-topic\route.ts

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
    const { token } = await request.json();
    await admin.messaging().subscribeToTopic(token, 'all');
    return NextResponse.json({ success: true, message: 'Subscribed to "all" topic' });
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return NextResponse.json({ success: false, error: 'Failed to subscribe to topic' }, { status: 500 });
  }
}