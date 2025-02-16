// hooks/useSendInvitation.ts

import { useState } from 'react';
import { useUserData } from '@/context/UserDataContext';

export const useSendInvitation = () => {
  const { userData } = useUserData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendInvitation = async () => {
    if (!userData) {
      setError("User data is not available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${userData.username} invites you!`,
          body: `${userData.username} invites you to a movie night!`,
          icon: '/icon-192x192.png',
          clickAction: 'https://localhost:3000/',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return { sendInvitation, isLoading, error };
};