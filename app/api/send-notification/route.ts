//app\api\send-notification\route.ts
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
    const { title, body, icon, clickAction, ...otherFields } = await request.json();
    const message = {
      notification: { 
        title, 
        body,
      },
      webpush: {
        notification: {
          icon,
          ...otherFields,
        },
        fcmOptions: {
          link: clickAction,
        },
      },
      topic: 'all',
    };
    const response = await admin.messaging().send(message);
    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
  }
}