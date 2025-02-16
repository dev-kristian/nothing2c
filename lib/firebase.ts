// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from "firebase/messaging";

import firebaseConfig from '../public/firebaseConfig';

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
// Set persistence to local to avoid third-party cookie issues
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app);
export const getMessagingInstance = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getMessaging(app);
  }
  return null;
};
