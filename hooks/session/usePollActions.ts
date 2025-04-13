import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { MediaPollItem } from '@/types'; // Import the new type

const callPollApi = async (url: string, method: string, body?: Record<string, unknown> | MediaPollItem) => { // Allow MediaPollItem in body type
  const response = await fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`API Error (${method} ${url}):`, response.status, errorData);
    throw new Error(errorData.error || `API request failed (status: ${response.status})`);
  }
  return response.status === 204 ? null : await response.json();
};


export const usePollActions = () => {
  const { user } = useAuthContext();

  // Removed createPoll function

  // Updated to accept MediaPollItem
  const addMovieToPoll = useCallback(async (sessionId: string, mediaItem: MediaPollItem) => {
    if (!user) throw new Error('User must be logged in to add a media item');
    try {
      // Send the entire mediaItem object
      await callPollApi(`/api/sessions/${sessionId}/poll/movies`, 'POST', mediaItem);
    } catch (error) {
      console.error("Error adding media item to poll via API: ", error);
      throw error;
    }
  }, [user]);

  // Updated to use mediaId
  const removeMovieFromPoll = useCallback(async (sessionId: string, mediaId: number) => {
    if (!user) throw new Error('User must be logged in to remove a media item');
    try {
      await callPollApi(`/api/sessions/${sessionId}/poll/movies`, 'DELETE', { mediaId });
    } catch (error) {
      console.error("Error removing media item from poll via API: ", error);
      throw error;
    }
  }, [user]);

  // Updated to use mediaId - NOTE: Backend API /api/sessions/[sessionId]/poll/vote needs update too!
  const toggleVote = useCallback(async (sessionId: string, mediaId: number) => {
    if (!user) throw new Error('User must be logged in to vote');
    try {
      await callPollApi(`/api/sessions/${sessionId}/poll/vote`, 'PUT', { mediaId });
    } catch (error) {
      console.error("Error toggling vote via API: ", error);
      throw error;
    }
  }, [user]);

  return {
    // Removed createPoll from returned object
    addMovieToPoll,
    removeMovieFromPoll,
    toggleVote
  };
};
