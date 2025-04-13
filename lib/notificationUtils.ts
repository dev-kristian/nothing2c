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
  // Allow other custom data fields for webpush.notification, typically strings for data payload
  [key: string]: string | NotificationAction[] | undefined; // Use string, allow existing types
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

  // REMOVED: Base notification payload - will be sent in data payload instead
  // const fcmNotificationPayload = { title, body };

  // Construct the webpush specific config for visual/interactive elements
  // Note: Webpush notification options might still be useful for some platforms/settings,
  // but the core display logic will rely on data payload.
  const webpushConfig: admin.messaging.WebpushConfig = {
      notification: {
          icon,
          image,
          badge,
          actions,
          tag,
          // DO NOT put custom data here. Put it in the top-level 'data' field of the message.
          // Visual options only. Check MDN Web Push Notification docs for valid fields.
      },
      // fcmOptions.link is deprecated for web push actions, use data payload instead
  };

  // Construct the data payload (must be key-value pairs of strings)
  // Include ALL necessary info for the SW to build the notification
  const dataPayload: { [key: string]: string } = {
      click_action: clickAction || '',
      // Add display fields previously in 'notification' or 'webpush.notification'
      title: title || 'Notification', // Provide default if needed
      body: body || '', // Generic body template if needed, SW will override for sessions
      icon: icon || '/icon-192x192.png',
      image: image || '',
      badge: badge || '',
      tag: tag || '',
      // Actions need careful handling - stringify the array
      actions: actions ? JSON.stringify(actions) : '',
  };
  // Add other custom fields (sessionEpoch, sessionMovieTitle), ensuring they are strings
  for (const key in otherFields) {
      if (Object.prototype.hasOwnProperty.call(otherFields, key)) {
          const value = otherFields[key];
          // Ensure value is a string. Convert if necessary, or skip if complex type.
          if (typeof value === 'string') {
              dataPayload[key] = value;
          } else if (typeof value === 'number' || typeof value === 'boolean') {
              dataPayload[key] = String(value); // Convert numbers/booleans to strings
          } else {
              console.warn(`[notificationUtils] Skipping non-string data field '${key}' for FCM payload.`);
          }
      }
  }


  const sendPromises = recipients.map(uid => {
    const topic = `user_${uid}`;
    // Construct the final message for FCM - DATA-ONLY message
    const message: admin.messaging.Message = {
        // NO 'notification' field - prevents automatic display by FCM SDK
        webpush: webpushConfig, // Keep for potential platform-specific enhancements? Test removal if needed.
        data: dataPayload,      // All info needed by SW is here
        topic: topic,
    };

    // console.log(`[${topic}] Sending FCM message:`, JSON.stringify(message, null, 2)); // DEBUG

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
