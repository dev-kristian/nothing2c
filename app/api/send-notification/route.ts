// app/api/send-notification/route.ts
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
    const { title, body, icon, clickAction, recipients, ...otherFields } = await request.json();
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No recipients specified' 
      }, { status: 400 });
    }

    // Maximum number of recipients to prevent abuse
    const MAX_RECIPIENTS = 50;
    if (recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json({ 
        success: false, 
        error: `Too many recipients. Maximum allowed is ${MAX_RECIPIENTS}.` 
      }, { status: 400 });
    }
    
    // Create notification message
    const notification = {
      title,
      body,
    };

    // Create webpush configuration
    const webpush = {
      notification: {
        icon,
        ...otherFields,
      },
      fcmOptions: {
        link: clickAction,
      },
    };

    // Send to each recipient individually using their user-specific topic
    const sendPromises = recipients.map(uid => {
      // Safety check: Ensure uid is a string and not empty
      if (typeof uid !== 'string' || !uid) {
        console.error('Invalid recipient UID:', uid);
        return Promise.resolve(null);
      }
      
      const topic = `user_${uid}`;
      const message = {
        notification,
        webpush,
        topic,
      };
      
      return admin.messaging().send(message)
        .catch(error => {
          console.error(`Failed to send notification to ${topic}:`, error);
          return null;
        });
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(Boolean).length;

    return NextResponse.json({ 
      success: true, 
      message: `Successfully sent notifications to ${successCount}/${recipients.length} recipients` 
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send notification' 
    }, { status: 500 });
  }
}
