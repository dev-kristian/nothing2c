//context\SessionContext.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { SessionContextType } from '@/types';
import { 
  useCreateSession,
  useUpdateUserDates,
  usePollActions,
  useParticipantActions,
  useSessionSubscription
} from '@/hooks/watch-party';

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
  const { createPoll, addMovieToPoll, removeMovieFromPoll, toggleVote } = usePollActions();
  const updateParticipantStatus = useParticipantActions();
  const sessions = useSessionSubscription();

  const contextValue = useMemo(() => ({
    createSession,
    createPoll,
    updateUserDates,
    toggleVote,
    addMovieToPoll,
    removeMovieFromPoll,
    updateParticipantStatus,
    sessions
  }), [
    createSession,
    createPoll,
    updateUserDates,
    toggleVote,
    addMovieToPoll,
    removeMovieFromPoll,
    updateParticipantStatus,
    sessions
  ]);
  
  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};
