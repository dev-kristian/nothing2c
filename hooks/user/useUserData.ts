'use client'

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { UserData } from '@/types';

export const useUserData = () => {
  const { user } = useAuthContext();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      setIsLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const watchlistDocRef = doc(db, 'users', user.uid, 'userMovieData', 'watchlist');

    const unsubscribe = onSnapshot(userDocRef, async (docSnapshot) => {
      if (!docSnapshot.exists()) {
        const defaultUserData: UserData = {
          username: '',
          email: user.email || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          setupCompleted: false,
          uid: user.uid,
          watchlist: { movie: {}, tv: {} }
        };
        await setDoc(userDocRef, defaultUserData);
        setUserData(defaultUserData);
        setIsLoading(false);
        return;
      }

      const userInfo = docSnapshot.data();
      const watchlistSnapshot = await getDoc(watchlistDocRef);
      const watchlistData = watchlistSnapshot.exists() ? watchlistSnapshot.data() : { watchlist: { movie: {}, tv: {} } };

      setUserData({
        username: userInfo.username,
        email: userInfo.email,
        createdAt: userInfo.createdAt?.toDate(),
        updatedAt: userInfo.updatedAt?.toDate(),
        setupCompleted: userInfo.setupCompleted,
        uid: userInfo.uid,
        notification: userInfo.notification,
        ...watchlistData
      } as UserData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateNotificationStatus = async (status: 'allowed' | 'denied' | 'unsupported') => {
    if (!user) throw new Error("User not logged in");

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { notification: status }, { merge: true });
      setUserData(prev => prev ? { ...prev, notification: status } : null);
    } catch (error) {
      console.error("Error updating notification status:", error);
      throw error;
    }
  };

  return { userData, isLoading, updateNotificationStatus };
};