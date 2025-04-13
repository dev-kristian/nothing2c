import React, { useState, useMemo } from 'react';
import { Session } from '@/types';
import { useAuthUser } from '@/context/AuthUserContext';
import { useFriendsContext } from '@/context/FriendsContext';
import { Users, Plus, Crown, Calendar } from 'lucide-react'; 
import InviteFriendsDialog from './InviteFriendsDialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; 
import Image from 'next/image'; 
import { cn } from '@/lib/utils';
import { Check, Clock } from 'lucide-react'; 

interface ParticipantData {
  username: string;
  status: 'accepted' | 'invited' | 'declined';
}

interface Participant {
  uid: string;
  username: string;
  status: 'accepted' | 'invited' | 'declined';
}

interface SessionParticipantsProps {
  session: Session;
  isReadOnly: boolean;
}

const SessionParticipantsComponent: React.FC<SessionParticipantsProps> = ({ session, isReadOnly }) => {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const { userData, isLoading: isLoadingUser } = useAuthUser(); 
  const { friends, isLoadingFriends } = useFriendsContext(); 
  const isLoading = isLoadingUser || isLoadingFriends; 

  const friendsMap = useMemo(() => {
    return new Map(friends?.map(f => [f.uid, f]) || []);
  }, [friends]);

  const participants: Participant[] = useMemo(() => {
    return Object.entries(session.participants || {}).map(([uid, data]) => ({
      uid,
      username: (data as ParticipantData).username,
      status: (data as ParticipantData).status
    }));
  }, [session.participants]);

  const isCreator = useMemo(() => userData?.uid === session.createdByUid, [userData?.uid, session.createdByUid]);

  
  const { acceptedCategorized, pending, declined } = useMemo(() => {
    const accepted = participants.filter(p => p.status === 'accepted');
    const pending = participants.filter(p => p.status === 'invited');
    const declined = participants.filter(p => p.status === 'declined');

    const completedBoth: Participant[] = [];
    const completedOne: Participant[] = [];
    const completedNone: Participant[] = [];

    accepted.forEach(p => {
      const hasAddedAvailability = session.userDates?.[p.uid] && session.userDates[p.uid].length > 0;
      const hasVoted = session.poll?.votes?.[p.uid] && session.poll.votes[p.uid].length > 0;

      if (hasAddedAvailability && hasVoted) {
        completedBoth.push(p);
      } else if (hasAddedAvailability || hasVoted) {
        completedOne.push(p);
      } else {
        completedNone.push(p);
      }
    });

    
    const sortFn = (a: Participant, b: Participant) => a.username.localeCompare(b.username);
    completedBoth.sort(sortFn);
    completedOne.sort(sortFn);
    completedNone.sort(sortFn);


    return {
      acceptedCategorized: { completedBoth, completedOne, completedNone },
      pending,
      declined
    };
  }, [participants, session.userDates, session.poll?.votes]); 

  
  const renderParticipant = (person: Participant) => {
    const isCurrentUser = person.uid === userData?.uid;
    const isParticipantCreator = person.uid === session.createdByUid;
    const hasAddedAvailability = session.userDates?.[person.uid] && session.userDates[person.uid].length > 0;
    const hasVoted = session.poll?.votes?.[person.uid] && session.poll.votes[person.uid].length > 0;

    let photoUrl: string | null | undefined = undefined;
    if (isCurrentUser) {
      photoUrl = userData?.photoURL;
    } else {
      const friendData = friendsMap.get(person.uid);
      photoUrl = friendData?.photoURL;
    }
    const showImage = isCurrentUser ? !isLoading && photoUrl : photoUrl;

    return (
      <div key={person.uid} className="flex items-center space-x-1.5 bg-white dark:bg-system-background-secondary-dark px-2 py-1 rounded-full border border-gray-200 dark:border-system-background-tertiary-dark">
        <Avatar className="h-6 w-6">
          {showImage ? (
            <Image src={photoUrl!} alt={person.username} width={24} height={24} className="object-cover rounded-full" />
          ) : (
            <AvatarFallback className={cn(
              "text-xs font-medium",
              isParticipantCreator
              ? 'bg-system-pink/10 dark:bg-system-pink-dark/20 text-system-pink dark:text-system-pink-dark'
              : 'bg-gray-100 dark:bg-gray-800 text-label-secondary dark:text-label-secondary-dark'
          )}>
            {person.username.substring(0, 1).toUpperCase()}
          </AvatarFallback>
          )}
        </Avatar>
        <span className="text-xs font-medium text-label dark:text-label-dark">
          {person.username}
        </span>
        {isParticipantCreator && (
          <Crown size={10} className="text-system-pink dark:text-system-pink-dark ml-0.5" />
        )}
        {/* Add icons for completed actions */}
        {hasAddedAvailability && <Calendar size={10} className="text-green-600 dark:text-green-400 ml-0.5" />}
        {hasVoted && <Check size={10} className="text-blue-600 dark:text-blue-400 ml-0.5" />}
      </div>
    );
  };

  return (
    <div className="mb-6">
      <div className="mb-2 flex justify-between items-center">
        <div className="flex items-center">
          <Users size={16} className="text-label-secondary dark:text-label-secondary-dark mr-2" />
          <h2 className="text-base font-medium text-label dark:text-label-dark">Participants</h2>
        </div>
          
        {isCreator && !isReadOnly && (
          <Button
            onClick={() => setIsInviteDialogOpen(true)}
            className="h-8 px-3 text-xs bg-white dark:bg-gray-6-dark hover:bg-gray-50 dark:hover:bg-gray-6-dark text-label-secondary dark:text-label-secondary-dark hover:text-label dark:hover:text-label-dark border border-gray-200 dark:border-gray-700"
            variant="outline"
            size="sm"
          >
            <Plus size={14} className="mr-1.5" />
            Invite
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Categorized Attending Participants */}
        {acceptedCategorized.completedBoth.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-label-secondary dark:text-label-secondary-dark mb-2 flex items-center">
              <Check size={12} className="mr-1 text-green-600 dark:text-green-400" /> Ready · {acceptedCategorized.completedBoth.length}
            </h3>
            <div className="flex flex-wrap gap-2">
              {acceptedCategorized.completedBoth.map(renderParticipant)}
            </div>
          </div>
        )}
        {acceptedCategorized.completedOne.length > 0 && (
           <div>
             <h3 className="text-xs font-medium text-label-secondary dark:text-label-secondary-dark mb-2 flex items-center">
               <Clock size={12} className="mr-1 text-orange-500 dark:text-orange-400" /> Partially Ready · {acceptedCategorized.completedOne.length}
             </h3>
             <div className="flex flex-wrap gap-2">
               {acceptedCategorized.completedOne.map(renderParticipant)}
             </div>
           </div>
        )}
         {acceptedCategorized.completedNone.length > 0 && (
           <div>
             <h3 className="text-xs font-medium text-label-secondary dark:text-label-secondary-dark mb-2 flex items-center">
                Awaiting Input · {acceptedCategorized.completedNone.length}
             </h3>
             <div className="flex flex-wrap gap-2">
               {acceptedCategorized.completedNone.map(renderParticipant)}
             </div>
           </div>
        )}

        {/* Pending Participants */}
        {pending.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-label-secondary dark:text-label-secondary-dark mb-2">
              Pending · {pending.length}
            </h3>
            <div className="flex flex-wrap gap-2">
              {pending.map(person => {
                const friendData = friendsMap.get(person.uid);
                const photoUrl = friendData?.photoURL;

                return (
                  <div key={person.uid} className="flex items-center space-x-1.5 bg-white/60 dark:bg-system-background-secondary-dark/60 px-2 py-1 rounded-full border border-gray-200 dark:border-system-background-tertiary-dark opacity-70">
                    <Avatar className="h-6 w-6">
                      {photoUrl ? (
                        <Image src={photoUrl} alt={person.username} width={24} height={24} className="object-cover rounded-full" />
                      ) : (
                        <AvatarFallback className="text-xs font-medium">
                          {person.username.substring(0, 1).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-xs font-medium text-label-secondary dark:text-label-secondary-dark">
                      {person.username}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
      </div>

      <InviteFriendsDialog
        sessionId={session.id}
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
      />
    </div>
  );
};


const SessionParticipants = React.memo(SessionParticipantsComponent);

export default SessionParticipants;
