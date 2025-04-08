import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';

export const useParticipantActions = () => {
  const { user } = useAuthContext(); 

  return useCallback(async (
    sessionId: string,
    status: 'accepted' | 'declined'
  ) => {
    if (!user) throw new Error('User must be logged in to update status'); 

    try {
      const response = await fetch(`/api/sessions/${sessionId}/participants/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error updating participant status:", response.status, errorData);
        throw new Error(errorData.error || `Failed to update participant status (status: ${response.status})`);
      }

    } catch (error) {
      console.error("Error calling update participant status API: ", error);
      throw error; 
    }
  }, [user]); 
};
