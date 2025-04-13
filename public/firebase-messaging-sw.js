importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
importScripts('/firebaseConfig.js');

firebase.initializeApp(self.firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background data message ', payload);

  // Read ALL notification data from the top-level 'data' field
  const notificationData = payload.data || {};

  // Extract display details from data payload
  const notificationTitle = notificationData.title || 'Notification'; // Use title from data
  let notificationBody = notificationData.body || ''; // Use default body from data

  // Attempt to construct a more specific body for session notifications
  try {
    // Use the actual keys from the data payload
    const sessionEpochStr = notificationData.sessionEpoch; // Correct key
    const sessionMovieTitle = notificationData.sessionMovieTitle; // Correct key

    console.log(`[SW] Checking for sessionEpoch: ${sessionEpochStr}, sessionMovieTitle: ${sessionMovieTitle}`); // Log with correct keys

    if (sessionEpochStr && typeof sessionEpochStr === 'string') {
      const sessionEpoch = parseInt(sessionEpochStr, 10);
      if (!isNaN(sessionEpoch)) {
        const date = new Date(sessionEpoch);
        const formattedTime = date.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        const formattedDate = date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });

        if (sessionMovieTitle && typeof sessionMovieTitle === 'string' && sessionMovieTitle.trim() !== '') {
          notificationBody = `Watch '${sessionMovieTitle}' on ${formattedDate} at ${formattedTime}.`;
        } else {
          notificationBody = `Movie Night set for ${formattedDate} at ${formattedTime}.`;
        }
      } else {
        console.warn('[firebase-messaging-sw.js] sessionEpoch data was not a valid number string:', sessionEpochStr);
      }
    } else if (sessionMovieTitle && typeof sessionMovieTitle === 'string' && sessionMovieTitle.trim() !== '') {
        // Fallback if only movie title is present
        notificationBody = `The winning movie is '${sessionMovieTitle}'. Time TBD.`;
    }
    // If neither epoch nor title is present, the default body remains.

  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error processing notification data:', error);
    // Fallback to default body in case of error
    notificationBody = payload.notification.body;
  }


  // Attempt to parse actions if they exist
  let parsedActions;
  if (notificationData.actions && typeof notificationData.actions === 'string') {
    try {
      parsedActions = JSON.parse(notificationData.actions);
    } catch (e) {
      console.error('[firebase-messaging-sw.js] Error parsing notification actions:', e);
      parsedActions = undefined;
    }
  }

  // Construct notification options using data from the payload
  const notificationOptions = {
    body: notificationBody, // Use the potentially updated body
    icon: notificationData.icon || '/icon-192x192.png', // Use icon from data
    image: notificationData.image || undefined, // Use image from data
    badge: notificationData.badge || undefined, // Use badge from data
    tag: notificationData.tag || undefined, // Use tag from data
    actions: parsedActions, // Use parsed actions from data
    data: notificationData, // Pass the full data object along
    vibrate: [200, 100, 200],
    // requireInteraction: true, // Optional
  };

  // Check if title is present (it should be, as it's now required in data)
  if (!notificationTitle) {
      console.error("Notification title is missing in data payload:", notificationData);
      return; // Don't show notification without a title
  }

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);

  event.notification.close(); // Close the notification

  const clickActionUrl = event.notification.data?.click_action;

  // Handle action button clicks
  if (event.action === 'view_session' && clickActionUrl) {
    console.log('[firebase-messaging-sw.js] "View Session" action clicked.');
    event.waitUntil(clients.openWindow(clickActionUrl));
  } else if (clickActionUrl) {
    // Handle default notification click (if no specific action button was clicked)
    console.log('[firebase-messaging-sw.js] Default notification body clicked.');
    event.waitUntil(clients.openWindow(clickActionUrl));
  } else {
    console.log('[firebase-messaging-sw.js] No click_action URL found in notification data.');
  }
});
