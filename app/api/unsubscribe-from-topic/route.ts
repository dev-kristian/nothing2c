// app/api/unsubscribe-from-topic/route.ts
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    await admin.messaging().unsubscribeFromTopic(token, 'all');
    return NextResponse.json({ success: true, message: 'Unsubscribed from "all" topic' });
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return NextResponse.json({ success: false, error: 'Failed to unsubscribe from topic' }, { status: 500 });
  }
}
