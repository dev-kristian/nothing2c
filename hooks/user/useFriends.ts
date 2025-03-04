// hooks/user/useFriends.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { Friend, FriendRequest } from '@/types';
import useSWR from 'swr';
import { unstable_serialize } from 'swr'; // Import unstable_serialize


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
    error: friendsError,
    isLoading: isLoadingFriends,
    mutate: mutateFriends, // Use mutate to revalidate and update
  } = useSWR<{ friends: Friend[] }>(friendsKey);

  const friendRequestsKey = user?.uid ? `/api/friends/requests?userId=${user.uid}` : null;
  const {
    data: friendRequestsData,
    error: friendRequestsError,
    isLoading: isLoadingRequests,
    mutate: mutateFriendRequests, // Use mutate to revalidate and update
  } = useSWR<{ requests: FriendRequest[] }>(friendRequestsKey);

    const friends = friendsData?.friends || [];
    const friendRequests = friendRequestsData?.requests || [];


  // useEffect(() => { //No more need for the use effect since we manage cache and states using swr.
  //   if (user?.uid) {
  //     loadFriendRequests();
  //     loadFriends();
  //   }
  // }, [user?.uid, loadFriendRequests, loadFriends]);

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
      // You *could* optimistically update here, but it's usually best to revalidate:
      mutateFriends(); // Revalidate friends list (could be affected)
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

      // No need to manually update state. Use mutate.
      await mutateFriendRequests(); // Remove from requests
      await mutateFriends();      // Add to friends

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

      await mutateFriendRequests(); // Remove from requests

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
      await mutateFriends(); // Remove from friends

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