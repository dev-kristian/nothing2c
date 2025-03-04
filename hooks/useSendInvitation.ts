// hooks/useSendInvitation.ts

import { useState } from 'react';
import { useUserData } from '@/context/UserDataContext';
import useSWRMutation from 'swr/mutation';

interface SendInvitationArgs {
  title: string;
  body: string;
  icon: string;
  clickAction: string;
}

async function sendInvitationFetcher(url: string, { arg }: { arg: SendInvitationArgs }) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(arg),
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Failed to send invitation');
    }
    return data;
}


export const useSendInvitation = () => {
  const { userData } = useUserData();
  const { trigger, isMutating, error } = useSWRMutation('/api/send-notification', sendInvitationFetcher);

  const sendInvitation = async () => {
    if (!userData) {
      // No need to set a separate error state; SWR handles it.  Just throw.
      throw new Error("User data is not available");
    }

    try {
      await trigger({
        title: `${userData.username} invites you!`,
        body: `${userData.username} invites you to a movie night!`,
        icon: '/icon-192x192.png',
        clickAction: 'https://localhost:3000/', // Consider making this configurable
      });
    } catch (err) {
      //SWR will store the error for us. No need to use a local state.
      console.error('Error sending invitation:', err);
       // Optionally re-throw, depending on how you want to handle it higher up.
       throw err;
    }
  };

  return { sendInvitation, isLoading: isMutating, error: error?.message };
};