// hooks/useAuth.ts 
import { useEffect, useState, useCallback, useRef } from 'react';
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
import { toast } from "@/hooks/use-toast"; 

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
  const initialSyncDoneRef = useRef<boolean>(false); 

  const signIn = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      handleAuthError(error, 'Failed to sign in. Please try again.');
    }
  }, []);

  // Revised signOut to handle errors and return success status
  const signOut = useCallback(async (): Promise<boolean> => {
    // 1. Server-side logout
    const logoutUrl = `${window.location.origin}/api/auth/session-logout`;
    try {
      const response = await fetch(logoutUrl, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server-side logout failed:', response.status, errorText);
        // Throw an error to be caught by the calling component
        throw new Error(`Server logout failed: ${response.status}`);
      }
    } catch (error) {
      // Catch fetch errors or the error thrown above
      console.error('Error during server-side logout request:', error);
      // Re-throw the error for the calling component
      throw error;
    }

    // 2. Client-side logout (only if server logout succeeded)
    try {
      await firebaseSignOut(auth);
      return true; // Indicate successful sign out
    } catch (error) {
      // Handle potential Firebase sign-out errors
      console.error('Firebase sign out error:', error);
      // Throw the error for the calling component
      throw error;
    }
  }, []);


  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Auth persistence error:", error);
      });

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser && !initialSyncDoneRef.current) {
        initialSyncDoneRef.current = true;
        // Document creation is now handled server-side by /api/auth/session-login
        // No need to check/create document here anymore.
      } else if (!currentUser) {
         initialSyncDoneRef.current = false;
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
