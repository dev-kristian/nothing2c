import { useCallback, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { DateTimeSelection } from '@/types';

export const useUpdateUserDates = () => {
  const { user } = useAuthContext();
  const { userData } = useUserData(); 

  const lastUpdateTimestamp = useRef<number>(0);
  const pendingUpdate = useRef<{sessionId: string, dates: DateTimeSelection[]} | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const THROTTLE_DELAY = 2000;

  const executeUpdate = useCallback(async (sessionId: string, dates: DateTimeSelection[]) => {
    if (!user || !userData) throw new Error('User must be logged in to update dates');
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}/userDates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dates: dates.map(d => ({ ...d, date: d.date.toISOString() }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error updating user dates:", response.status, errorData);
        throw new Error(errorData.error || `Failed to update user dates (status: ${response.status})`);
      }

      lastUpdateTimestamp.current = Date.now();
      pendingUpdate.current = null;
    } catch (error) {
      console.error("Error updating user dates: ", error);
      throw error;
    }
  }, [user, userData]);

  return useCallback(async (sessionId: string, dates: DateTimeSelection[]) => {
    pendingUpdate.current = { sessionId, dates };
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimestamp.current;
    
    if (timeSinceLastUpdate < THROTTLE_DELAY) {
      updateTimeoutRef.current = setTimeout(() => {
        if (pendingUpdate.current) {
          executeUpdate(pendingUpdate.current.sessionId, pendingUpdate.current.dates);
        }
      }, THROTTLE_DELAY - timeSinceLastUpdate);
      
      return;
    }
    
    await executeUpdate(sessionId, dates);
    
  }, [executeUpdate]);
};
