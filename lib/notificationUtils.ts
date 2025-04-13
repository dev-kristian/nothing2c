import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    console.warn("Attempting to initialize Firebase Admin SDK from notificationUtils.ts - should be initialized earlier.");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PRIVATE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.NEXT_PRIVATE_FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.NEXT_PRIVATE_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (initError) {
     console.error("Firebase Admin Init Error in notificationUtils.ts:", initError);
  }
}

interface NotificationAction {
    action: string; 
    title: string; 
    icon?: string; 
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  clickAction?: string; 
  image?: string; 
  badge?: string; 
  tag?: string; 
  actions?: NotificationAction[]; 
  
  [key: string]: string | NotificationAction[] | undefined; 
}

interface SendNotificationResult {
  successCount: number;
  failureCount: number;
  totalAttempted: number;
  errors: { uid: string; error: string }[];
}

/**
 * Sends notifications to a list of recipients via Firebase Cloud Messaging.
 * Assumes Firebase Admin SDK is initialized.
 *
 * @param recipients - An array of user UIDs to send notifications to.
 * @param payload - The notification content (title, body, icon, clickAction, etc.).
 * @returns A promise resolving to an object with success/failure counts and errors.
 */
export const sendNotificationToRecipients = async (
  recipients: string[],
  payload: NotificationPayload
): Promise<SendNotificationResult> => {

  if (!admin.apps.length) {
      const errorMsg = "Firebase Admin SDK not initialized. Cannot send notifications.";
      console.error(errorMsg);
      
      return { successCount: 0, failureCount: recipients.length, totalAttempted: recipients.length, errors: recipients.map(uid => ({ uid, error: errorMsg })) };
  }

  if (!recipients || recipients.length === 0) {
    return { successCount: 0, failureCount: 0, totalAttempted: 0, errors: [] };
  }

  
  const {
      title,
      body,
      icon = '/icon-192x192.png', 
      clickAction, 
      image,
      badge,
      tag,
      actions,
      ...otherFields 
  } = payload;
  
  const dataPayload: { [key: string]: string } = {
      click_action: clickAction || '',
      title: title || 'Notification', 
      body: body || '', 
      icon: icon || '/icon-192x192.png',
      image: image || '',
      badge: badge || '',
      tag: tag || '',
      actions: actions ? JSON.stringify(actions) : '',
  };
  
  for (const key in otherFields) {
      if (Object.prototype.hasOwnProperty.call(otherFields, key)) {
          const value = otherFields[key];
          
          if (typeof value === 'string') {
              dataPayload[key] = value;
          } else if (typeof value === 'number' || typeof value === 'boolean') {
              dataPayload[key] = String(value); 
          } else {
              console.warn(`[notificationUtils] Skipping non-string data field '${key}' for FCM payload.`);
          }
      }
  }

  const sendPromises = recipients.map(uid => {
    const topic = `user_${uid}`;
    const message: admin.messaging.Message = {
        data: dataPayload,      
        apns: { 
            payload: {
                aps: {
                    'content-available': 1 
                }
            }
        },
        topic: topic,
    };
    
    return admin.messaging().send(message)
      .then(response => ({ uid, status: 'success' as const, response }))
      .catch(error => {
        const errorMessage = error.code || error.message || 'Unknown FCM error';
        console.error(`Failed to send notification to ${topic} (User: ${uid}):`, errorMessage);
        return { uid, status: 'error' as const, error: errorMessage }; 
      });
  });

  const results = await Promise.all(sendPromises);

  const successCount = results.filter(r => r.status === 'success').length;
  const errors = results
    .filter((r): r is { uid: string; status: 'error'; error: string } => r.status === 'error') 
    .map(r => ({ uid: r.uid, error: r.error }));

  return {
    successCount,
    failureCount: errors.length,
    totalAttempted: recipients.length,
    errors,
  };
};
