
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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


const AuthContext = createContext<AuthState | null>(null);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false);
  const [isSessionVerified, setIsSessionVerified] = useState(false);

  const signIn = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      handleAuthError(error, 'Failed to sign in. Please try again.');
    }
  }, []);

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
      
      
    }

    try {
      await firebaseSignOut(auth);
      
      markSessionVerified(false);
      return true;
    } catch (error) {
      console.error('Firebase sign out error:', error);
      throw error;
    }
  }, [markSessionVerified]); 

  
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Auth persistence error:", error);
      });

    
    const unsubscribe = onIdTokenChanged(auth, (currentUser) => {
      setUser(currentUser); 
      
    });

    return () => unsubscribe(); 
  }, []); 

  
  useEffect(() => {
    const verifySessionWithBackend = async () => {
      if (!user) {
        markSessionVerified(false);
        setLoading(false);
        setInitialAuthChecked(true); 
        return;
      }


      try {
        
        const response = await fetch('/api/users/me');

        if (response.ok) {
          markSessionVerified(true);
        } else {
          markSessionVerified(false);
          
          
        }
      } catch (error) {
        console.error('[AuthContext] Network error during backend verification:', error);
        markSessionVerified(false); 
      } finally {
        setLoading(false);
        setInitialAuthChecked(true); 
      }
    };

    verifySessionWithBackend();
  }, [user, markSessionVerified]); 
  

  
  const value: AuthState = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    initialAuthChecked,
    isSessionVerified,
    markSessionVerified,
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
