// hooks/useSendInvitation.ts
import { useUserData } from '@/context/UserDataContext';
import useSWRMutation from 'swr/mutation';
import { Friend } from '@/types';

interface SendInvitationArgs {
  title: string;
  body: string;
  icon: string;
  clickAction: string;
  recipients: string[]; // Array of user UIDs
  sessionId: string;    // Add session ID for deep linking
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

  const sendInvitation = async (selectedFriends: Friend[], sessionId: string) => {
    if (!userData) {
      throw new Error("User data is not available");
    }

    try {
      await trigger({
        title: `${userData.username} invites you!`,
        body: `${userData.username} invites you to a movie night!`,
        icon: '/icon-192x192.png',
        clickAction: `https://localhost:3000/watch-together/${sessionId}`,
        recipients: selectedFriends.map(friend => friend.uid),
        sessionId
      });
    } catch (err) {
      console.error('Error sending invitation:', err);
      throw err;
    }
  };

  return { sendInvitation, isLoading: isMutating, error: error?.message };
};
