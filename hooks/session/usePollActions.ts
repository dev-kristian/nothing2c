import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';

const callPollApi = async (url: string, method: string, body?: Record<string, unknown>) => {
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

  const createPoll = useCallback(async (sessionId: string, movieTitles: string[]) => {
    if (!user) throw new Error('User must be logged in to create a poll');
    try {
      await callPollApi(`/api/sessions/${sessionId}/poll`, 'POST', { movieTitles });
    } catch (error) {
      console.error("Error creating poll via API: ", error);
      throw error;
    }
  }, [user]);

  const addMovieToPoll = useCallback(async (sessionId: string, movieTitle: string) => {
    if (!user) throw new Error('User must be logged in to add a movie');
    try {
      await callPollApi(`/api/sessions/${sessionId}/poll/movies`, 'POST', { movieTitle });
    } catch (error) {
      console.error("Error adding movie to poll via API: ", error);
      throw error;
    }
  }, [user]);

  const removeMovieFromPoll = useCallback(async (sessionId: string, movieTitle: string) => {
    if (!user) throw new Error('User must be logged in to remove a movie');
    try {
      await callPollApi(`/api/sessions/${sessionId}/poll/movies`, 'DELETE', { movieTitle });
    } catch (error) {
      console.error("Error removing movie from poll via API: ", error);
      throw error;
    }
  }, [user]);

  const toggleVote = useCallback(async (sessionId: string, movieTitle: string) => {
    if (!user) throw new Error('User must be logged in to vote');
    try {
      await callPollApi(`/api/sessions/${sessionId}/poll/vote`, 'PUT', { movieTitle });
    } catch (error) {
      console.error("Error toggling vote via API: ", error);
      throw error;
    }
  }, [user]);

  return {
    createPoll,
    addMovieToPoll,
    removeMovieFromPoll,
    toggleVote
  };
};
