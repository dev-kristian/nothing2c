import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/context/SessionContext'; 
import { Session } from '@/types';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InvitationActionsBannerProps {
  session: Session;
  onDeclineInitiated: () => void;
  // Removed isReadOnly prop
}

const InvitationActionsBanner: React.FC<InvitationActionsBannerProps> = ({ session, onDeclineInitiated }) => {
  const { updateParticipantStatus } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoadingAccept, setIsLoadingAccept] = useState(false);
  const [isLoadingDecline, setIsLoadingDecline] = useState(false);

  const handleUpdateStatus = async (status: 'accepted' | 'declined') => {

    const isLoadingSetter = status === 'accepted' ? setIsLoadingAccept : setIsLoadingDecline;
    isLoadingSetter(true);

    if (status === 'declined') {
      onDeclineInitiated();
    }

    try {
      await updateParticipantStatus(session.id, status);

      toast({
        title: `Invitation ${status}`,
        description: `You have successfully ${status} the invitation.`,
        variant: 'default',
      });

      if (status === 'declined') {
        router.push('/watch-together');
      }

    } catch (error) {
      console.error(`Error ${status} invitation:`, error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Could not update invitation status.',
      });
    } finally {
      isLoadingSetter(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-400/10 dark:to-purple-400/10 border border-blue-500/20 dark:border-blue-400/20 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div>
        <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100">
          You&apos;re Invited!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {session.createdBy} has invited you to this movie night session. Accept to participate.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUpdateStatus('declined')}
          disabled={isLoadingAccept || isLoadingDecline} // Reverted disabled condition
          className="bg-white/50 dark:bg-black/20 border-gray-300 dark:border-gray-700 hover:bg-white dark:hover:bg-black/30"
        >
          {isLoadingDecline ? 'Declining...' : 'Decline'}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => handleUpdateStatus('accepted')}
          disabled={isLoadingAccept || isLoadingDecline} // Reverted disabled condition
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
        >
          {isLoadingAccept ? 'Accepting...' : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept Invitation
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default InvitationActionsBanner;
