import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { DateTimeSelection } from '@/types';

export const useUpdateUserDates = () => {
  const { user } = useAuthContext();
  const { userData } = useUserData();

  return useCallback(async (sessionId: string, dates: DateTimeSelection[]) => {
    if (!user || !userData) throw new Error('User must be logged in to update dates');
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        [`userDates.${userData.username}`]: dates.map(({ date, hours }) => ({
          date: Timestamp.fromDate(date),
          hours: hours === 'all' ? 'all' : hours.map(h => {
            const dateCopy = new Date(date);
            dateCopy.setHours(h);
            return Timestamp.fromDate(dateCopy);
          })
        }))
      });
    } catch (error) {
      console.error("Error updating user dates: ", error);
      throw error;
    }
  }, [user, userData]);
};
