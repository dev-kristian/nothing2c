// hooks/useAuth.ts 
import { useEffect, useState, useCallback } from 'react';
import {
  onIdTokenChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { handleAuthError } from '@/lib/utils';

async function syncSession(endpoint: string, body?: Record<string, unknown>) {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${window.location.origin}${path}`;

  try {
    const response = await fetch(url, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      console.error(`Failed to sync session (${endpoint}):`, response.status, await response.text());
    } else {
    }
  } catch (error) {
    console.error(`Network error during session sync (${endpoint}):`, error);
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);

  const signIn = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      handleAuthError(error, 'Failed to sign in. Please try again.');
    }
  }, []); 

  const signOut = useCallback(async () => {
    try {
      await syncSession('/api/auth/session-logout');
      await firebaseSignOut(auth);
    } catch (error) {
      handleAuthError(error, 'Failed to sign out. Please try again.');
    }
  }, []);


  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Auth persistence error:", error);
      });

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser); 

      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          await syncSession('/api/auth/session-login', { idToken });

          if (currentUser.emailVerified) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
              const userData = {
                uid: currentUser.uid,
                email: currentUser.email,
                createdAt: serverTimestamp(),
                username: "",
                setupCompleted: false,
              };
              await setDoc(userDocRef, userData);
            }
          }
        } catch (error) {
          console.error("Error during auth state processing:", error);
        }
      } else {
      }

      setLoading(false);
      setInitialAuthChecked(true);
    });

    return () => unsubscribe();
  }, []); 

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    initialAuthChecked,
    auth
  };
}
