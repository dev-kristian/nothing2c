// hooks/user/useFriends.ts
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { Friend, FriendRequest } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, doc } from 'firebase/firestore';
import isEqual from 'lodash/isEqual'; // Import isEqual

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

export const useFriends = (): UseFriendsReturn => {
  const { user } = useAuthContext();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState<boolean>(true);

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(true);


  useEffect(() => {
    if (!user?.uid) {
      setFriendRequests([]);
      setIsLoadingRequests(false);
      return;
    }

    setIsLoadingRequests(true);
    const requestsRef = collection(db, 'users', user.uid, 'friendRequests');
    const q = query(requestsRef, where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        setFriendRequests([]);
        setIsLoadingRequests(false);
        return;
      }

      const requests: FriendRequest[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          fromUid: data.fromUid as string,
          fromUsername: data.fromUsername || 'unknown user',
          fromPhotoURL: data.fromPhotoURL || undefined,
          status: data.status as 'pending',
          timestamp: (data.timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          exists: true,
        };
      });

      setFriendRequests(requests);
      setIsLoadingRequests(false);

    }, (error) => {
      console.error("Error listening to friend requests:", error);
      setIsLoadingRequests(false);
      setFriendRequests([]); 
    });

    return () => unsubscribe();

  }, [user?.uid]); 


  useEffect(() => {
    if (!user?.uid) {
      setFriends([]);
      setIsLoadingFriends(false);
      return; 
    }

    setIsLoadingFriends(true);
    const friendsDocRef = doc(db, 'users', user.uid, 'friends', 'data');

    const unsubscribe = onSnapshot(friendsDocRef, async (docSnapshot) => {
      if (!docSnapshot.exists() || !docSnapshot.data()?.friendsList) {
        setFriends([]);
        setIsLoadingFriends(false);
        return;
      }

      const friendsListMap = docSnapshot.data()?.friendsList || {};
      const friendUids = Object.keys(friendsListMap);

      if (friendUids.length === 0) {
        setFriends([]);
        setIsLoadingFriends(false);
        return;
      }

      const friendsData: Friend[] = Object.entries(friendsListMap).map(([uid, details]) => {
        const friendDetails = details as { username: string; photoURL?: string | null };
        return {
          uid: uid,
          username: friendDetails.username || 'unknown user',
          photoURL: friendDetails.photoURL || undefined,
          exists: true,
        };
      });

      setFriends(prevFriends => {
        if (!isEqual(prevFriends, friendsData)) {
          return friendsData;
        } else {
          return prevFriends;
        }
      });
      setIsLoadingFriends(false);

    }, (error) => {
      console.error("Error listening to friends list:", error);
      setIsLoadingFriends(false);
      setFriends([]);
    });

    return () => unsubscribe();

  }, [user?.uid]); 


  const sendFriendRequest = async (targetUser: { uid: string; username: string }) => {
    if (!user?.uid) throw new Error('Not authenticated');
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUser })
      });
      if (!response.ok) throw new Error('Failed to send friend request');
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  };

 const acceptFriendRequest = async (request: FriendRequest) => {
    if (!user?.uid) throw new Error('Not authenticated');

    const originalRequests = friendRequests;
    setFriendRequests(prevRequests => prevRequests.filter(req => req.id !== request.id));

    const newFriendOptimistic: Friend = {
        uid: request.fromUid,
        username: request.fromUsername,
        photoURL: request.fromPhotoURL,
        exists: request.exists
    };
    const originalFriends = friends;
    setFriends(prevFriends =>
        prevFriends.some(f => f.uid === newFriendOptimistic.uid)
            ? prevFriends
            : [...prevFriends, newFriendOptimistic]
    );

    try {
      const response = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: request.fromUid }),
      });

      if (!response.ok) {
        setFriendRequests(originalRequests);
        setFriends(originalFriends);
        throw new Error('Failed to accept friend request');
      }

    } catch (error) {
      console.error('Error accepting friend request:', error);
      setFriendRequests(originalRequests);
      setFriends(originalFriends);
      throw error;
    }
  };

 const rejectFriendRequest = async (request: FriendRequest) => {
    if (!user?.uid) throw new Error('Not authenticated');

    const originalRequests = friendRequests;
    setFriendRequests(prevRequests => prevRequests.filter(req => req.id !== request.id));

    try {
      const response = await fetch('/api/friends/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: request.fromUid })
      });

      if (!response.ok) {
        setFriendRequests(originalRequests);
        throw new Error('Failed to reject friend request');
      }

    } catch (error) {
      console.error('Error rejecting friend request:', error);
      setFriendRequests(originalRequests);
      throw error;
    }
  };

 const removeFriend = async (friend: Friend) => {
    if (!user?.uid) throw new Error('Not authenticated');

    const originalFriends = friends;
    setFriends(prevFriends => prevFriends.filter(f => f.uid !== friend.uid));

    try {
      const response = await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: friend.uid })
      });

      if (!response.ok) {
        setFriends(originalFriends);
        throw new Error('Failed to remove friend');
      }

    } catch (error) {
      console.error('Error removing friend:', error);
      setFriends(originalFriends);
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
