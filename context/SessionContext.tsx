import React, { createContext, useContext, useMemo } from 'react';
import { SessionContextType } from '@/types';
import {
  useCreateSession,
  useUpdateUserDates,
  usePollActions,
  useParticipantActions,
  useSessionSubscription
} from '@/hooks/session';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const createSession = useCreateSession();
  const updateUserDates = useUpdateUserDates();
  // Removed createPoll from destructuring
  const { addMovieToPoll, removeMovieFromPoll, toggleVote } = usePollActions();
  const updateParticipantStatus = useParticipantActions();
  const { sessions, initialLoadComplete } = useSessionSubscription();

  const contextValue = useMemo(() => ({
    createSession,
    // Removed createPoll from context value
    updateUserDates,
    toggleVote,
    addMovieToPoll,
    removeMovieFromPoll,
    updateParticipantStatus,
    sessions: sessions || [], 
    isLoading: !initialLoadComplete
  }), [
    createSession,
    // Removed createPoll from dependency array
    updateUserDates,
    toggleVote,
    addMovieToPoll,
    removeMovieFromPoll,
    updateParticipantStatus,
    sessions,
    initialLoadComplete
  ]);
 
  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};
