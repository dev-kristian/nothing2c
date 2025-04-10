import React, { useState, useMemo } from 'react'; // Added useMemo
import { motion } from 'framer-motion';
import { Session} from '@/types';
import { useUserData } from '@/context/UserDataContext';
import { Users, Plus } from 'lucide-react';
import InviteFriendsDialog from './InviteFriendsDialog';

interface ParticipantsListProps {
  session: Session;
  onInviteClick: () => void;
  isReadOnly: boolean; // Add isReadOnly prop
}

interface ParticipantData {
  username: string;
  status: 'accepted' | 'invited' | 'declined';
}

interface Participant {
  uid: string;
  username: string;
  status: 'accepted' | 'invited' | 'declined';
}

// Destructure isReadOnly directly from props here
const ParticipantsList: React.FC<ParticipantsListProps> = ({ session, onInviteClick, isReadOnly }) => {
  const { userData } = useUserData();

  // Memoize participants array derivation
  const participants: Participant[] = useMemo(() => {
    return Object.entries(session.participants || {}).map(([uid, data]) => ({
      uid,
      username: (data as ParticipantData).username,
  status: (data as ParticipantData).status
    }));
  }, [session.participants]);

  // Memoize creator check
  const isCreator = useMemo(() => userData?.uid === session.createdByUid, [userData?.uid, session.createdByUid]);
  // Removed incorrect destructuring from here

  // Memoize filtered arrays
  const { accepted, pending, declined } = useMemo(() => {
    const accepted = participants.filter(p => p.status === 'accepted');
    const pending = participants.filter(p => p.status === 'invited');
    const declined = participants.filter(p => p.status === 'declined');
    return { accepted, pending, declined };
  }, [participants]);

  return (
    <div className="space-y-5 px-4">
      {accepted.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase text-label-secondary dark:text-label-secondary-dark mb-2.5">
            Attending · {accepted.length}
          </h3>
          <div className="flex flex-wrap gap-4">
            {accepted.map(person => (
              <div key={person.uid} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-system-background dark:bg-gray-6-dark shadow-apple-sm dark:shadow-apple-dark-sm ${
                  person.uid === session.createdByUid ? 'ring-1 ring-system-pink dark:ring-system-pink-dark' : ''
                }`}>
                  <span className="text-lg font-medium text-label dark:text-label-dark">
                    {person.username.substring(0, 1).toUpperCase()}
                  </span>
                </div>
                <span className="mt-1.5 text-xs text-center max-w-16 truncate">
                  {person.username}
                </span>
                {person.uid === session.createdByUid && (
                  <span className="mt-0.5 text-system-pink dark:text-system-pink-dark text-[10px]">
                    Host
                  </span>
                )}
              </div>
            ))}
            
            {isCreator && (
              <motion.button
                onClick={onInviteClick}
                whileHover={!isReadOnly ? { scale: 1.05 } : {}}
                whileTap={!isReadOnly ? { scale: 0.95 } : {}}
                className={`flex flex-col items-center group ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                disabled={isReadOnly} // Disable button if read-only
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center border border-gray group-hover:border-pink text-gray hover:text-pink transition-colors" 
                >
                  <Plus size={20} />
                </div>
                <span className="mt-1.5 text-xs text-center text-gray group-hover:text-pink transition-colors"> 
                  Invite
                </span>
              </motion.button>
            )}
          </div>
        </div>
      )}
      
      {pending.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase text-label-secondary dark:text-label-secondary-dark mb-2.5">
            Pending · {pending.length}
          </h3>
          <div className="flex flex-wrap gap-4">
            {pending.map(person => (
              <div key={person.uid} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-system-background dark:bg-gray-6-dark shadow-apple-sm dark:shadow-apple-dark-sm opacity-60">
                  <span className="text-lg font-medium text-label-secondary dark:text-label-secondary-dark">
                    {person.username.substring(0, 1).toUpperCase()}
                  </span>
                </div>
                <span className="mt-1.5 text-xs text-center text-label-secondary dark:text-label-secondary-dark max-w-16 truncate">
                  {person.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {declined.length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase text-label-secondary dark:text-label-secondary-dark mb-2.5">
            Declined · {declined.length}
          </h3>
          <div className="flex flex-wrap gap-4">
            {declined.map(person => (
              <div key={person.uid} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-system-background dark:bg-gray-6-dark shadow-apple-sm dark:shadow-apple-dark-sm opacity-40">
                  <span className="text-lg font-medium text-label-tertiary dark:text-label-tertiary-dark">
                    {person.username.substring(0, 1).toUpperCase()}
                  </span>
                </div>
                <span className="mt-1.5 text-xs text-center text-label-tertiary dark:text-label-tertiary-dark max-w-16 truncate">
                  {person.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface SessionParticipantsProps {
  session: Session;
  isReadOnly: boolean; // Add isReadOnly prop here too
}

const SessionParticipants: React.FC<SessionParticipantsProps> = ({ session, isReadOnly }) => {
  const [expanded, setExpanded] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const participantCount = Object.keys(session.participants || {}).length;
  const acceptedCount = Object.values(session.participants || {})
    .filter(p => (p as ParticipantData).status === 'accepted').length;
  
  return (
    <div className="pb-6">
      <div 
        onClick={() => setExpanded(!expanded)}
        className="bg-white dark:bg-gray-6-dark rounded-2xl p-5 backdrop-blur-md backdrop-saturate-150 border border-white/10 dark:border-white/5 cursor-pointer transition-all hover:bg-white/70 dark:hover:bg-gray-5-dark"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full  text-gray dark:text-gray-dark">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-medium text-label dark:text-label-dark">Participants</h2>
              <p className="text-xs text-label-secondary dark:text-label-secondary-dark">
                {acceptedCount} of {participantCount} attending
              </p>
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-label-secondary dark:text-label-secondary-dark"
          >
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </div>
      </div>
      
      <motion.div
        initial={false}
        animate={{ 
          height: expanded ? "auto" : "0px",
          opacity: expanded ? 1 : 0
        }}
        transition={{ 
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1.0]
        }}
        className="overflow-hidden"
      >
        <div className="mt-1 bg-white/80 dark:bg-gray-6-dark/50 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 dark:border-white/5 py-5">
          {/* Pass isReadOnly down to ParticipantsList */}
          <ParticipantsList session={session} onInviteClick={() => setIsInviteDialogOpen(true)} isReadOnly={isReadOnly} />
        </div>
      </motion.div>

      <InviteFriendsDialog
        sessionId={session.id}
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
      />
    </div>
  );
};

export default SessionParticipants;
