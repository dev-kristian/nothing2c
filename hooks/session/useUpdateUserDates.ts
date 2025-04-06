import { useCallback, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { DateTimeSelection } from '@/types';

export const useUpdateUserDates = () => {
  const { user } = useAuthContext();
  const { userData } = useUserData();
  
  // Rate limiting variables
  const lastUpdateTimestamp = useRef<number>(0);
  const pendingUpdate = useRef<{sessionId: string, dates: DateTimeSelection[]} | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const THROTTLE_DELAY = 2000; // 2 seconds between updates

  const executeUpdate = useCallback(async (sessionId: string, dates: DateTimeSelection[]) => {
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
      
      // Update the timestamp after successful update
      lastUpdateTimestamp.current = Date.now();
      pendingUpdate.current = null;
    } catch (error) {
      console.error("Error updating user dates: ", error);
      throw error;
    }
  }, [user, userData]);

  return useCallback(async (sessionId: string, dates: DateTimeSelection[]) => {
    // Always store the most recent update request
    pendingUpdate.current = { sessionId, dates };
    
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimestamp.current;
    
    // If we've recently updated, delay this update
    if (timeSinceLastUpdate < THROTTLE_DELAY) {
      // Schedule the update for later
      updateTimeoutRef.current = setTimeout(() => {
        if (pendingUpdate.current) {
          executeUpdate(pendingUpdate.current.sessionId, pendingUpdate.current.dates);
        }
      }, THROTTLE_DELAY - timeSinceLastUpdate);
      
      return;
    }
    
    // Otherwise, execute immediately
    await executeUpdate(sessionId, dates);
    
  }, [executeUpdate]);
};
