// hooks/useAuth.ts (Modified)
import { useEffect, useState, useCallback } from 'react'; // Import useCallback
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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialAuthChecked, setInitialAuthChecked] = useState(false); // New state

  // Wrap signIn and signOut in useCallback for better performance and memoization.
  const signIn = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, []);


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
      setInitialAuthChecked(true); // Mark initial auth check as complete
    });

    return () => unsubscribe();
  }, []); // Empty dependency array, runs only once on mount

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    initialAuthChecked // Expose initialAuthChecked
  };
}