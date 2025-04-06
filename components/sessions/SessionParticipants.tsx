import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Session } from '@/types';
import { useUserData } from '@/context/UserDataContext';
import { Users, Plus } from 'lucide-react';

interface SessionParticipantsProps {
  session: Session;
}

// Define a type for participant data
interface ParticipantData {
  username: string;
  status: 'accepted' | 'invited' | 'declined';
}

interface Participant {
  uid: string;
  username: string;
  status: 'accepted' | 'invited' | 'declined';
}

const ParticipantsList: React.FC<SessionParticipantsProps> = ({ session }) => {
  const { userData } = useUserData();
  
  // Extract participants with proper typing
  const participants: Participant[] = Object.entries(session.participants || {}).map(([uid, data]) => ({
    uid,
    username: (data as ParticipantData).username,
    status: (data as ParticipantData).status
  }));
  
  // Check if current user is creator
  const isCreator = userData?.uid === session.createdByUid;
  
  // Sections for different statuses
  const accepted = participants.filter(p => p.status === 'accepted');
  const pending = participants.filter(p => p.status === 'invited');
  const declined = participants.filter(p => p.status === 'declined');
  
  return (
    <div className="space-y-5 px-4">
      {/* Attending */}
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
            
            {/* Invite button placed within the attending section */}
            {isCreator && (
              <div className="flex flex-col items-center">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-system-pink/10 dark:bg-system-pink-dark/15 border border-system-pink/20 dark:border-system-pink-dark/20 text-system-pink dark:text-system-pink-dark"
                >
                  <Plus size={20} />
                </motion.button>
                <span className="mt-1.5 text-xs text-center text-system-pink dark:text-system-pink-dark">
                  Invite
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Pending */}
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
      
      {/* Declined */}
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

const SessionParticipants: React.FC<SessionParticipantsProps> = ({ session }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Count participants
  const participantCount = Object.keys(session.participants || {}).length;
  const acceptedCount = Object.values(session.participants || {})
    .filter(p => (p as ParticipantData).status === 'accepted').length;
  
  return (
    <div className="pb-6">
      {/* Summary card - always visible */}
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
      
      {/* Expandable detailed view */}
      <motion.div
        initial={false}
        animate={{ 
          height: expanded ? "auto" : "0px",
          opacity: expanded ? 1 : 0
        }}
        transition={{ 
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1.0]  // Apple's easing
        }}
        className="overflow-hidden"
      >
        <div className="mt-1 bg-white/80 dark:bg-gray-6-dark/50 backdrop-blur-md rounded-xl overflow-hidden border border-white/10 dark:border-white/5 py-5">
          <ParticipantsList session={session} />
        </div>
      </motion.div>
    </div>
  );
};

export default SessionParticipants;
