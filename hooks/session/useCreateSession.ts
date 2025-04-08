import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { DateTimeSelection, Friend } from '@/types'; 

interface CreateSessionResponse {
  sessionId: string;
}

export const useCreateSession = () => {
  const { user } = useAuthContext();
  const { userData } = useUserData(); 

  return useCallback(async (
    dates: DateTimeSelection[],
    selectedFriends: Friend[]
  ): Promise<string> => { 
    if (!user || !userData) { 
      throw new Error('User must be logged in to create a session');
    }

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dates: dates.map(d => ({ ...d, date: d.date.toISOString() })), 
          selectedFriends
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); 
        console.error("API Error creating session:", response.status, errorData);
        throw new Error(errorData.error || `Failed to create session (status: ${response.status})`);
      }

      const result: CreateSessionResponse = await response.json();
      return result.sessionId; 

    } catch (error) {
      console.error("Error calling create session API: ", error);
      throw error;
    }
  }, [user, userData]);
};
