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
import { auth } from '@/lib/firebase';
import { handleAuthError } from '@/lib/utils';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
  const [isSessionVerified, setIsSessionVerified] = useState(false); // Re-add session verification state
  // Removed unused initialSyncDoneRef

  const signIn = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      handleAuthError(error, 'Failed to sign in. Please try again.');
    }
  }, []);

  // Re-add function to explicitly mark session as verified
  const markSessionVerified = useCallback((verified: boolean) => {
    setIsSessionVerified(verified);
  }, []);

  const signOut = useCallback(async (): Promise<boolean> => {
    const logoutUrl = `${window.location.origin}/api/auth/session-logout`;
    try {
      const response = await fetch(logoutUrl, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server-side logout failed:', response.status, errorText);
        throw new Error(`Server logout failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error during server-side logout request:', error);
      throw error;
    }

    try {
      await firebaseSignOut(auth);
      return true;
    } catch (error) {
      console.error('Firebase sign out error:', error);
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

      // If user logs out, reset session verification status
      if (!currentUser) {
        setIsSessionVerified(false);
      }

      // Removed logic related to initialSyncDoneRef as it seemed unused

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
    isSessionVerified, // Add isSessionVerified back to return
    markSessionVerified, // Re-add markSessionVerified
    auth,
  };
}
