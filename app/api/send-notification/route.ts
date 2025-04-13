
import { NextResponse, NextRequest } from 'next/server'; 
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';
import { sendNotificationToRecipients } from '@/lib/notificationUtils'; 




export async function POST(request: NextRequest) { 
  try {
    
    
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authenticatedUserId = userProfile.uid; 
    

    
    const { sessionId, title, body, icon, clickAction, recipients, ...otherFields } = await request.json(); 

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No recipients specified'
      }, { status: 400 });
    }

    
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
        
        
        const participants = sessionData?.participants || {};
        if (!participants[authenticatedUserId]) {
            console.warn(`Authorization failed: User ${authenticatedUserId} is not part of session ${sessionId}`);
            return NextResponse.json({ error: 'Forbidden: Sender is not part of the session' }, { status: 403 });
        }
    } catch (authError) {
        console.error(`Error during authorization check for session ${sessionId}, user ${authenticatedUserId}:`, authError);
        return NextResponse.json({ error: 'Internal Server Error (Authorization Check)' }, { status: 500 });
    }
    


    const MAX_RECIPIENTS = 50; 
    if (recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json({
        success: false,
        error: `Too many recipients. Maximum allowed is ${MAX_RECIPIENTS}.`
      }, { status: 400 });
    }

    
    const recipientsList = recipients as unknown[];

    
    const validStringRecipients = recipientsList.filter((uid): uid is string => typeof uid === 'string' && uid.trim() !== '');
    const validRecipients = validStringRecipients.filter(uid => uid !== authenticatedUserId);


    if (validRecipients.length === 0) {
       return NextResponse.json({ success: true, message: 'No valid recipients to notify (excluding sender).' });
    }

    
    const notificationPayload = {
        title,
        body,
        icon,
        clickAction,
        ...otherFields 
    };

    
    const result = await sendNotificationToRecipients(validRecipients, notificationPayload);

    if (result.failureCount > 0) {
        console.warn(`[API Route] Failed to send notifications to ${result.failureCount} recipients for session ${sessionId}.`);
        
        
    }

    
    return NextResponse.json({
      success: result.failureCount === 0, 
      message: `Attempted to send notifications. Success: ${result.successCount}/${result.totalAttempted}. Failures: ${result.failureCount}.`
      
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send notification' 
    }, { status: 500 });
  }
}
