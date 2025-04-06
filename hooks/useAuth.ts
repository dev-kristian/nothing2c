// hooks/useAuth.ts 
import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
// No longer need useCustomToast here
import { handleAuthError } from '@/lib/utils'; // Import the error handler utility

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
      await firebaseSignOut(auth);
    } catch (error) {
      // Optionally, handle sign-out errors with a toast as well
      // Call handleAuthError with only error and optional message
      handleAuthError(error, 'Failed to sign out. Please try again.');
    }
  }, []); // Remove showToast from dependency array


  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Auth persistence error:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        if (currentUser.emailVerified) {
          try {
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
          } catch (error) {
            console.error("Error writing to Firestore:", error);
          }
        }
      } else {
        setUser(null);
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
    initialAuthChecked 
  };
}
