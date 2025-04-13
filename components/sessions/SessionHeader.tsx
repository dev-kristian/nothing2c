import React from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react'; 
import { Session, DatePopularity } from '@/types';
import { formatEpochToLocalDate } from '@/lib/dateTimeUtils';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; 
import { differenceInDays } from 'date-fns';

interface SessionHeaderProps {
  session: Session;
  datePopularity: DatePopularity[];
  currentUserId: string | undefined; 
  onInitiateCompleteSession: () => void; 
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  session,
  datePopularity,
  currentUserId,
  onInitiateCompleteSession,
}) => {
  const formattedDate = formatEpochToLocalDate(session.createdAtEpoch);
  const daysAgo = differenceInDays(new Date(), new Date(session.createdAtEpoch));
  const isCreator = currentUserId === session.createdByUid;
  const isActive = session.status === 'active';

  return (
    <div className="mb-6">
      {/* Back Button */}
      <div className="mb-4">
        <Link
         href="/watch-together" className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-system-pink dark:hover:text-system-pink-dark transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span className="text-sm">Back to Sessions</span>
        </Link>
      </div>

      {/* Main Header Row */}
      <div className="flex justify-between items-start">
        {/* Left Side: Title and Date */}
        <div>
          <h1 className="text-2xl font-bold text-label dark:text-label-dark">
            Movie Night with{' '}
            <span className="font-medium text-system-pink dark:text-system-pink-dark">
            {session.createdBy}
            </span>
          </h1>

          <div className="flex flex-wrap items-center mt-2 text-sm text-label-secondary dark:text-label-secondary-dark">
            {/* Date information */}
            <div className="flex items-center">
              <span>{formattedDate}</span>
              <span className="ml-1 text-label-tertiary dark:text-label-tertiary-dark">
                ({daysAgo} day{daysAgo !== 1 ? 's' : ''} ago)
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Complete Button (Conditional) */}
        {isCreator && isActive && (
          <Button
            onClick={onInitiateCompleteSession}
            variant="outline"
            size="sm"
            className="ml-4 flex-shrink-0" 
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Session
          </Button>
        )}
      </div>
    </div>
  );
};

export default SessionHeader;
