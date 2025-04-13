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

// Define the structure for notification actions
interface NotificationAction {
    action: string; // Identifier for the action
    title: string; // Text displayed on the button
    icon?: string; // Optional icon for the button
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  clickAction?: string; // Keep for data payload
  image?: string; // Optional large image
  badge?: string; // Optional monochrome badge icon
  tag?: string; // Optional tag for grouping/replacing notifications
  actions?: NotificationAction[]; // Optional action buttons
  // Allow other custom data fields for webpush.notification
  [key: string]: any;
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

  // Destructure all potential fields from the payload
  const {
      title,
      body,
      icon = '/icon-192x192.png', // Default icon
      clickAction, // Keep for data payload
      image,
      badge,
      tag,
      actions,
      ...otherFields // Capture any remaining fields for custom data
  } = payload;

  // Base notification payload for FCM (title and body are standard)
  const fcmNotificationPayload = { title, body };

  // Construct the webpush specific config, including new visual options
  const webpushConfig: admin.messaging.WebpushConfig = { // Use specific type
      notification: {
          icon, // Standard icon
          image, // Add image if provided
          badge, // Add badge if provided
          actions, // Add actions if provided
          tag, // Add tag if provided
          // Include click_action and any other custom data in the 'data' payload
          // This is the standard way to handle clicks and custom info in service workers
          data: { click_action: clickAction, ...otherFields },
          // Spread other custom data fields here ONLY if they are valid Webpush Notification options
          // Example: requireInteraction, silent, etc. Check MDN docs for valid options.
          // ...otherFields
      },
      // fcmOptions.link is deprecated for web push actions, use data payload instead
  };

  const sendPromises = recipients.map(uid => {
    const topic = `user_${uid}`;
    // Construct the final message for FCM, including webpush config
    const message: admin.messaging.Message = {
        notification: fcmNotificationPayload,
        webpush: webpushConfig,
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
