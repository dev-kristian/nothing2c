
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
import type { AuthState } from '@/types';
import { toast } from '@/hooks/use-toast';
import { mutate } from 'swr'; // Import global mutate from SWR


const AuthContext = createContext<AuthState | null>(null);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Will be set to false after initial check
  const [isServerSessionPending, setServerSessionPending] = useState(false); // NEW state
  const initialCheckDone = useRef(false); // Use ref for initial loading flag

  // Removed initialAuthChecked and isSessionVerified states

  const signIn = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      handleAuthError(error, 'Failed to sign in. Please try again.');
    }
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

    // No longer need initialCheckDone variable inside the effect
    const unsubscribe = onIdTokenChanged(auth, (currentUser) => {
      const previousUser = user; // 'user' is now correctly captured due to dependency
      setUser(currentUser);

      // Trigger revalidation only if auth state actually changes (login/logout)
      if (previousUser?.uid !== currentUser?.uid) {
        mutate('/api/users/me'); // Revalidate user profile data
      }

      // Set loading to false only once after the first check
      if (!initialCheckDone.current) {
        setLoading(false);
        initialCheckDone.current = true;
      }
    });

    return () => unsubscribe();
  }, [user]); // Add 'user' dependency

  // NEW: Effect to verify server session when Firebase user is detected client-side
  useEffect(() => {
    const verifyServerSession = async () => {
      // Only run if Firebase client detects a user AND we are NOT actively trying to set up a server session
      if (user && !isServerSessionPending) {
        try {
          const response = await fetch('/api/auth/verify-session');
          if (!response.ok) {
            // Server session is invalid, show toast and force client sign out
            console.warn('[AuthContext] Server session invalid, forcing client sign out.');
            toast({
              title: "Session Invalid",
              description: "Your session has expired or become invalid. You have been signed out.",
              variant: "destructive",
            });
            await signOut();
          }
        } catch (error) {
          console.error('[AuthContext] Error verifying server session:', error);
          // Optional: Sign out on network error too? Depends on desired behavior.
          // await signOut();
        }
      }
    };

    verifyServerSession();
  }, [user, signOut, isServerSessionPending]); // Add isServerSessionPending dependency


  // Removed redundant useEffect for backend session verification


  const value: AuthState = {
    user,
    loading, // Reflects initial Firebase auth check
    signIn,
    signOut,
    isAuthenticated: !!user,
    isServerSessionPending,
    setServerSessionPending,
    auth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuthContext(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
