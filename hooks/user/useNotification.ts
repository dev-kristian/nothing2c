import { useAuthContext } from '@/context/AuthContext';

export const useNotification = () => {
  const { user } = useAuthContext();

  const updateNotificationStatus = async (status: 'allowed' | 'denied' | 'unsupported') => {
    if (!user) throw new Error('User not logged in');

    try {
      const response = await fetch('/api/users/notification', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty object
        throw new Error(errorData.error || `Failed to update notification status: ${response.statusText}`);
      }
      // Optionally, you could return something or trigger a re-fetch if needed elsewhere
    } catch (error) {
      console.error('Error updating notification status via API:', error);
      throw error; // Re-throw the error for the caller to handle
    }
  };

  return { updateNotificationStatus };
};
