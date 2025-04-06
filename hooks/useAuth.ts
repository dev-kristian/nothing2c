// hooks/useAuth.ts 
import { useEffect, useState, useCallback } from 'react';
import {
  onIdTokenChanged, // Changed from onAuthStateChanged
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { handleAuthError } from '@/lib/utils'; // Import the error handler utility

// Helper function for API calls
async function syncSession(endpoint: string, body?: any) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      console.error(`Failed to sync session (${endpoint}):`, response.status, await response.text());
    } else {
      // console.log(`Session sync successful (${endpoint})`);
    }
  } catch (error) {
    console.error(`Network error during session sync (${endpoint}):`, error);
  }
}
// No longer need useCustomToast here
// Duplicate import removed from here

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  // Remove useCustomToast usage
  const [loading, setLoading] = useState(true);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);

  const signIn = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      // Call handleAuthError with only error and optional message
      handleAuthError(error, 'Failed to sign in. Please try again.');
      // No longer re-throwing the error as it's handled by the toast
    }
  }, []); // Remove showToast from dependency array

  const signOut = useCallback(async () => {
    try {
      // Sync logout with server *before* signing out locally
      await syncSession('/api/auth/session-logout');
      await firebaseSignOut(auth);
      // User state will be set to null by the onIdTokenChanged listener
    } catch (error) {
      handleAuthError(error, 'Failed to sign out. Please try again.');
    }
  }, []);


  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Auth persistence error:", error);
      });

    // Use onIdTokenChanged for better session management integration
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser); // Update user state immediately

      if (currentUser) {
        // User is signed in or token refreshed
        try {
          const idToken = await currentUser.getIdToken();
          // Sync login/refresh with server
          await syncSession('/api/auth/session-login', { idToken });

          // Firestore check/creation logic (can remain)
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
          // Handle potential errors getting token or writing to Firestore
        }
      } else {
        // User is signed out
        // No need to call session-logout here as signOut function handles it before firebaseSignOut
        // setUser(null) is already called above
      }

      // Update loading/checked state regardless of user status
      setLoading(false);
      setInitialAuthChecked(true);
    });

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs once on mount

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    initialAuthChecked 
  };
}
