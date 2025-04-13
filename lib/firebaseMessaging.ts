// lib/firebaseMessaging.ts
import { getToken, onMessage, MessagePayload } from "firebase/messaging";
import { getMessagingInstance } from "./firebase";
import { getAuth } from "firebase/auth";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const requestForToken = async (retryCount = 0): Promise<string | null> => {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    return null;
  }

  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
    });
    
    if (currentToken) {
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        await fetch('/api/subscribe-to-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: currentToken,
            topic: `user_${user.uid}`,
          }),
        });
      }

      return currentToken;
    } else {
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
    return () => {};
  }

  return onMessage(messaging, (payload: MessagePayload) => {
    callback(payload);
  });
};
