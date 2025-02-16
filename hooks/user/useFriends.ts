import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { Friend, FriendRequest } from '@/types';

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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  const loadFriendRequests = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoadingRequests(true);
    try {
      const response = await fetch(`/api/friends/requests?userId=${user.uid}`);
      if (!response.ok) throw new Error('Failed to fetch friend requests');
      const data = await response.json();
      setFriendRequests(data.requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [user?.uid]);

  const loadFriends = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoadingFriends(true);
    try {
      const response = await fetch(`/api/friends/list?userId=${user.uid}`);
      if (!response.ok) throw new Error('Failed to fetch friends list');
      const data = await response.json();
      setFriends(data.friends);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadFriendRequests();
      loadFriends();
    }
  }, [user?.uid, loadFriendRequests, loadFriends]);

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

      // Update local state
      setFriendRequests(prev => prev.filter(req => req.id !== request.id));
      const newFriend: Friend = {
        uid: request.fromUid,
        username: request.fromUsername
      };
      setFriends(prev => [...prev, newFriend]);
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
      // Update local state
      setFriendRequests(prev => prev.filter(req => req.id !== request.id));
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
      setFriends(prev => prev.filter(f => f.uid !== friend.uid));
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
