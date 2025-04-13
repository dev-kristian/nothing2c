importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
importScripts('/firebaseConfig.js');

firebase.initializeApp(self.firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background data message ', payload);

  
  const notificationData = payload.data || {};

  
  const notificationTitle = notificationData.title || 'Notification'; 
  let notificationBody = notificationData.body || ''; 

  
  try {
    
    const sessionEpochStr = notificationData.sessionEpoch; 
    const sessionMovieTitle = notificationData.sessionMovieTitle; 

    console.log(`[SW] Checking for sessionEpoch: ${sessionEpochStr}, sessionMovieTitle: ${sessionMovieTitle}`); 

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
        
        notificationBody = `The winning movie is '${sessionMovieTitle}'. Time TBD.`;
    }
    

  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error processing notification data:', error);
    
    notificationBody = payload.notification.body;
  }


  
  let parsedActions;
  if (notificationData.actions && typeof notificationData.actions === 'string') {
    try {
      parsedActions = JSON.parse(notificationData.actions);
    } catch (e) {
      console.error('[firebase-messaging-sw.js] Error parsing notification actions:', e);
      parsedActions = undefined;
    }
  }

  
  const notificationOptions = {
    body: notificationBody, 
    icon: notificationData.icon || '/icon-192x192.png', 
    image: notificationData.image || undefined, 
    badge: notificationData.badge || undefined, 
    tag: notificationData.tag || undefined, 
    actions: parsedActions, 
    data: notificationData, 
    vibrate: [200, 100, 200],
    
  };

  
  if (!notificationTitle) {
      console.error("Notification title is missing in data payload:", notificationData);
      return; 
  }

  
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);

  event.notification.close(); 

  const clickActionUrl = event.notification.data?.click_action;

  
  if (event.action === 'view_session' && clickActionUrl) {
    console.log('[firebase-messaging-sw.js] "View Session" action clicked.');
    event.waitUntil(clients.openWindow(clickActionUrl));
  } else if (clickActionUrl) {
    
    console.log('[firebase-messaging-sw.js] Default notification body clicked.');
    event.waitUntil(clients.openWindow(clickActionUrl));
  } else {
    console.log('[firebase-messaging-sw.js] No click_action URL found in notification data.');
  }
});
