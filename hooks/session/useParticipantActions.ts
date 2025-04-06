import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const useParticipantActions = () => {
  const { user } = useAuthContext();
  const { userData } = useUserData();

  return useCallback(async (
    sessionId: string, 
    status: 'accepted' | 'declined'
  ) => {
    if (!user || !userData) throw new Error('User must be logged in to update status');
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        [`participants.${user.uid}.status`]: status
      });
    } catch (error) {
      console.error("Error updating participant status: ", error);
      throw error;
    }
  }, [user, userData]);
};
