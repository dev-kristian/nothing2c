import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { DateTimeSelection } from '@/types'; // UserDate is implicitly handled by the util
import { localSelectionsToUTCEpoch } from '@/lib/dateTimeUtils'; // Import the centralized function

// Removed the local convertToEpochUserDates function

export const useUpdateUserDates = () => {
  const { user } = useAuthContext();

  const updateUserDates = useCallback(async (sessionId: string, dates: DateTimeSelection[]) => {
    if (!user) {
      console.error('User must be logged in to update dates');
      return Promise.reject(new Error('User not logged in')); 
    }


    // Use the centralized utility function for conversion
    const epochUserDates = localSelectionsToUTCEpoch(dates); 
    const payload = { dates: epochUserDates }; 

    try {
      const response = await fetch(`/api/sessions/${sessionId}/userDates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        console.error("API Error updating user dates:", response.status, errorData);
        throw new Error(errorData.message || `Failed to update availability: ${response.statusText}`);
      } else {
        return await response.json().catch(() => ({ success: true })); 
      }

    } catch (error) {
      console.error("Error updating user dates:", error);
      throw error;
    }
  }, [user]);

  return updateUserDates;
};
