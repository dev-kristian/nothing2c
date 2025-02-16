importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
importScripts('/firebaseConfig.js');

firebase.initializeApp(self.firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  if (!self.clients.matchAll()) {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: payload.notification.icon || '/icon-192x192.png',
      image: payload.notification.image|| '/icon-512x512.png',
      vibrate: payload.notification.vibrate|| [200, 100, 200],
      data: {
        clickAction: payload.data?.clickAction,
      },
      // You can add more options here, like:
      // badge: '/badge-icon.png',
      // image: '/large-image.jpg',
      // vibrate: [200, 100, 200],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.notification.data && event.notification.data.clickAction) {
    clients.openWindow(event.notification.data.clickAction);
  }
});