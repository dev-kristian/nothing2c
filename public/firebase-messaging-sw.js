importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
importScripts('/firebaseConfig.js');

firebase.initializeApp(self.firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification appearance
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.webpush?.notification?.icon || payload.notification?.icon || '/icon-192x192.png', // Prefer webpush specific icon
    image: payload.webpush?.notification?.image, // Use image from webpush config
    badge: payload.webpush?.notification?.badge, // Use badge from webpush config
    tag: payload.webpush?.notification?.tag, // Use tag from webpush config
    actions: payload.webpush?.notification?.actions, // Use actions from webpush config
    data: payload.webpush?.notification?.data || {}, // Use data from webpush config (contains click_action)
    vibrate: [200, 100, 200], // Example vibration pattern
    // requireInteraction: true, // Optional: Keep notification until user interacts
  };

  // Check if the payload structure is as expected
  if (!notificationTitle) {
      console.error("Notification title is missing in payload:", payload);
      return; // Don't show notification without a title
  }

  // Show the notification
  // Use `self.registration.showNotification` which is standard for service workers
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
