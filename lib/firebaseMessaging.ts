// lib/firebaseMessaging.ts
import { getToken, onMessage, MessagePayload } from "firebase/messaging";
import { getMessagingInstance } from "./firebase";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const requestForToken = async (retryCount = 0): Promise<string | null> => {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.log('Firebase messaging is not supported in this browser');
    return null;
  }

  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
    });
    if (currentToken) {
      console.log('Token:', currentToken);
      
      // Send a "warm-up" notification
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: currentToken,
          silent: true, // This should be handled in your backend to send a silent notification
        }),
      });

      return currentToken;
    } else {
      console.log('No registration token available.');
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return requestForToken(retryCount + 1);
      }
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return requestForToken(retryCount + 1);
    }
    return null;
  }
};

export const onMessageListener = async (callback: (payload: MessagePayload) => void) => {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.log('Firebase messaging is not supported in this browser');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log("Received foreground message", payload);
    callback(payload);
  });
};