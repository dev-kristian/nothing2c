import { useCallback, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { DateTimeSelection } from '@/types';

export const useUpdateUserDates = () => {
  const { user } = useAuthContext();

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 1500;

  const executeUpdate = useCallback(async (sessionId: string, dates: DateTimeSelection[]) => {
    if (!user) {
        console.error('User must be logged in to update dates');
        return;
    }

    console.log(`Executing update for session ${sessionId} with ${dates.length} dates after debounce.`); // Added log

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
      } else {
        console.log(`Successfully updated dates for session ${sessionId}`); 
      }

    } catch (error) {
      console.error("Error during executeUpdate:", error);
    }
  }, [user]);

  // Removed debouncing to match expected Promise return type
  return useCallback(async (sessionId: string, dates: DateTimeSelection[]) => {
    try {
      await executeUpdate(sessionId, dates);
    } catch (error) {
      console.error("Error executing update:", error);
      // Optionally re-throw or handle error as needed
    }
  }, [executeUpdate]); 
};
