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
      // Optional: console.debug(`Session sync successful (${endpoint})`);
    }
  } catch (error) {
    // Check if the error is a TypeError, often indicating a fetch interrupted by navigation
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Log less severely or ignore, as this might be expected during post-login redirects
      console.debug(`Session sync fetch (${endpoint}) was potentially interrupted by navigation:`, error.message);
    } else {
      // Log other network errors as actual errors
      console.error(`Network error during session sync (${endpoint}):`, error);
    }
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
  const [serverVerifiedUid, setServerVerifiedUid] = useState<string | null>(null); // Added state for server session check

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

  // Effect to verify server session on initial load
  useEffect(() => {
    const verifyServerSession = async () => {
      try {
        const response = await fetch('/api/auth/verify-session'); // Assuming this endpoint exists
        if (response.ok) {
          const data = await response.json();
          setServerVerifiedUid(data.uid || null); // Store UID if verified
        } else {
          setServerVerifiedUid(null);
        }
      } catch (error) {
        console.error("Error verifying server session:", error);
        setServerVerifiedUid(null);
      }
    };
    verifyServerSession();
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
        // PWA Fix: Check for mismatch between client (null) and server (verified)
        if (serverVerifiedUid !== null) {
          console.warn("Auth mismatch detected (Client: null, Server: verified). Forcing sign out.");
          firebaseSignOut(auth).catch(err => console.error("Error during forced sign out:", err));
          // Clear the server state as it's now invalid relative to client
          setServerVerifiedUid(null);
          // setUser(null) is implicitly handled as currentUser is null here
        }
      }

      // Only set loading false after the initial check completes
      // and potentially after the mismatch logic runs.
      setLoading(false);
      setInitialAuthChecked(true);
    });

    return () => unsubscribe();
  }, [serverVerifiedUid]); // <-- Added serverVerifiedUid to dependency array

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
