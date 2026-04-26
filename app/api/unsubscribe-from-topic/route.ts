// app/api/unsubscribe-from-topic/route.ts
import { NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';

export async function POST(request: Request) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authenticatedUserId = userProfile.uid;

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

    const targetUid = topic.substring(5);
    if (authenticatedUserId !== targetUid) {
      console.warn(`Forbidden attempt: User ${authenticatedUserId} tried to unsubscribe topic ${topic}`);
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Cannot unsubscribe from another user\'s topic'
      }, { status: 403 });
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
