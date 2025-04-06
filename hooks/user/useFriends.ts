// hooks/user/useFriends.ts
import { useAuthContext } from '@/context/AuthContext';
import { Friend, FriendRequest } from '@/types';
import useSWR from 'swr';


interface UseFriendsReturn {
  friends: Friend[];
  friendRequests: FriendRequest[];
  isLoadingFriends: boolean;
  isLoadingRequests: boolean;
  sendFriendRequest: (targetUser: { uid: string; username: string }) => Promise<void>;
  acceptFriendRequest: (request: FriendRequest) => Promise<void>;
  rejectFriendRequest: (request: FriendRequest) => Promise<void>;
  removeFriend: (friend: Friend) => Promise<void>;
}

export const useFriends = (currentUsername?: string): UseFriendsReturn => {
  const { user } = useAuthContext();

  const friendsKey = user?.uid ? `/api/friends/list?userId=${user.uid}` : null;
  const {
    data: friendsData,
    isLoading: isLoadingFriends,
    mutate: mutateFriends, 
  } = useSWR<{ friends: Friend[] }>(friendsKey);

  const friendRequestsKey = user?.uid ? `/api/friends/requests?userId=${user.uid}` : null;
  const {
    data: friendRequestsData,
    isLoading: isLoadingRequests,
    mutate: mutateFriendRequests, 
  } = useSWR<{ requests: FriendRequest[] }>(friendRequestsKey);

    const friends = friendsData?.friends || [];
    const friendRequests = friendRequestsData?.requests || [];

  const sendFriendRequest = async (targetUser: { uid: string; username: string }) => {
    if (!user?.uid || !currentUsername)
      throw new Error('Not authenticated');
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUser: { uid: user.uid, username: currentUsername },
          targetUser
        })
      });
      if (!response.ok) throw new Error('Failed to send friend request');
      mutateFriends(); 
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  };

  const acceptFriendRequest = async (request: FriendRequest) => {
    if (!user?.uid || !currentUsername)
      throw new Error('Not authenticated');
    try {
      const response = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: user.uid,
          requesterId: request.fromUid,
          requesterUsername: request.fromUsername,
          currentUsername
        })
      });
      if (!response.ok) throw new Error('Failed to accept friend request');

      await mutateFriendRequests(); 
      await mutateFriends();

    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  };

  const rejectFriendRequest = async (request: FriendRequest) => {
    if (!user?.uid) throw new Error('Not authenticated');
    try {
      const response = await fetch('/api/friends/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: user.uid,
          requesterId: request.fromUid
        })
      });
      if (!response.ok) throw new Error('Failed to reject friend request');

      await mutateFriendRequests();

    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  };

  const removeFriend = async (friend: Friend) => {
    if (!user?.uid) throw new Error('Not authenticated');
    try {
      const response = await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: user.uid,
          friendId: friend.uid
        })
      });
      if (!response.ok) throw new Error('Failed to remove friend');
      await mutateFriends();

    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  };

  return {
    friends,
    friendRequests,
    isLoadingFriends,
    isLoadingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
  };
};