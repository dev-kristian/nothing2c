import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/context/SessionContext'; 
import { Session } from '@/types';
import { CheckCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SpinningLoader from '@/components/SpinningLoader';

interface InvitationActionsBannerProps {
  session: Session;
  onDeclineInitiated: () => void;
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
        title: `Invitation ${status === 'accepted' ? 'Accepted' : 'Declined'}`,
        description: `You have successfully ${status === 'accepted' ? 'accepted' : 'declined'} the invitation.`,
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
    <div className="mb-6">
      <div className="bg-white/70 dark:bg-gray-6-dark/70 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="font-semibold text-base text-label dark:text-label-dark flex items-center justify-center sm:justify-start">
              <span className="inline-block w-6 h-6 rounded-full bg-system-pink/10 dark:bg-system-pink-dark/20 flex items-center justify-center mr-2">
                <span className="block w-2 h-2 rounded-full bg-system-pink dark:bg-system-pink-dark animate-pulse"></span>
              </span>
              You&apos;re Invited!
            </h3>
            <p className="text-sm text-label-secondary dark:text-label-secondary-dark mt-1">
              {session.createdBy} has invited you to join this movie night session
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus('declined')}
              disabled={isLoadingAccept || isLoadingDecline}
              className="border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            >
              {isLoadingDecline ? (
                <>
                  <SpinningLoader size={14} className="mr-2" />
                  <span>Declining...</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-1.5" />
                  <span>Decline</span>
                </>
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleUpdateStatus('accepted')}
              disabled={isLoadingAccept || isLoadingDecline}
              className="bg-system-pink hover:bg-system-pink/90 dark:bg-system-pink-dark dark:hover:bg-system-pink-dark/90 text-white"
            >
              {isLoadingAccept ? (
                <>
                  <SpinningLoader size={14} className="mr-2" />
                  <span>Accepting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  <span>Accept Invitation</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationActionsBanner;