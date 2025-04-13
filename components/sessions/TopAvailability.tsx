import React, { useMemo, useState } from 'react';
import { Users, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'; // Removed Eye as it wasn't used
import { Badge } from '@/components/ui/badge';
import { formatEpochToLocalDate, formatEpochToLocalTime } from '@/lib/dateTimeUtils';
import { Session } from '@/types'; // Import Session type

// Interface remains the same as DatePopularity now contains userIds
interface DatePopularity {
  dateEpoch: number;
  count: number;
  users: string[]; // Contains userIds
  hours?: Record<string, {
    hourEpoch: number;
    count: number;
    users: string[]; // Contains userIds
  }>;
}

interface TopAvailabilityProps {
  datePopularity: DatePopularity[];
  participants: Session['participants']; // Add participants prop
}

interface ProcessedDate extends DatePopularity {
  isAllDay: boolean;
  popularHours: Array<{
    hourEpoch: number;
    count: number;
    users: string[]; // Contains userIds
    percentage: number;
  }>;
}

interface TopAvailabilityCardProps {
  date: ProcessedDate;
  index: number;
  participants: Session['participants']; // Add participants prop
}

const TopAvailabilityCard: React.FC<TopAvailabilityCardProps> = ({ date, index, participants }) => {
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Map userIds to usernames for display
  const userNames = useMemo(() => {
    return date.users.map(userId => participants[userId]?.username || 'Unknown')
                     .filter(name => name !== 'Unknown'); // Filter out if user not found
  }, [date.users, participants]);

  const hasMoreUsers = userNames.length > 3;
  // Display usernames now
  const displayUsernames = showAllUsers ? userNames : userNames.slice(0, 3);

  return (
    <div
      className="bg-white dark:bg-gray-6-dark backdrop-blur-md rounded-xl overflow-hidden border border-white/10 dark:border-white/5 transition-all duration-200 hover:shadow-sm flex flex-col h-full"
    >
      <div className="px-3 pt-3 pb-2 border-b border-separator/20 dark:border-separator-dark/20">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-sm text-label dark:text-label-dark">
              {formatEpochToLocalDate(date.dateEpoch)}
            </h3>
            <div className="flex items-center text-xs text-label-secondary dark:text-label-secondary-dark mt-0.5">
              <Users className="w-3 h-3 mr-1 opacity-70" />
              {/* Use userNames.length for accurate count of known participants */}
              <span>{userNames.length} {userNames.length === 1 ? 'person' : 'people'}</span>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`text-xs ${index === 0 ? 'bg-system-pink/10 dark:bg-system-pink-dark/15 text-system-pink dark:text-system-pink-dark' : ''}`}
          >
            {index === 0 ? '#1 Pick' : `#${index + 1}`}
          </Badge>
        </div>
      </div>

      <div className="p-3 flex-grow">
        {date.isAllDay ? (
          <div className="flex items-center p-2 bg-system-green/10 dark:bg-system-green-dark/10 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4 text-system-green dark:text-system-green-dark mr-1.5" />
            <span className="font-medium text-label dark:text-label-dark">Available All Day</span>
          </div>
        ) : date.popularHours.length > 0 ? (
          <div>
            <div className="flex items-center mb-2">
              <Clock className="w-3 h-3 text-label-secondary dark:text-label-secondary-dark mr-1 opacity-70" />
              <h4 className="text-xs font-medium">Popular Times</h4>
            </div>

            <div className="space-y-1.5">
              {/* Map userIds to usernames for hour popularity display if needed, though not currently shown */}
              {date.popularHours.map((hour: { hourEpoch: number; count: number; percentage: number; users: string[] }, i: number) => (
                <div
                  key={hour.hourEpoch}
                  className={`relative overflow-hidden rounded-md border ${i === 0 ? 'border-system-pink/30 dark:border-system-pink-dark/30' : 'border-separator/30 dark:border-separator-dark/30'}`}
                  // Optionally add title with usernames for the hour
                  title={hour.users.map(uid => participants[uid]?.username || '?').join(', ')}
                >
                  <div
                    className={`absolute top-0 left-0 h-full ${i === 0 ? 'bg-system-pink/10 dark:bg-system-pink-dark/15' : 'bg-gray-100 dark:bg-gray-5-dark'}`}
                    style={{ width: `${hour.percentage}%` }}
                  />

                  <div className="relative flex items-center justify-between p-1.5 z-10 text-sm">
                    <div className="flex items-center">
                      {i === 0 && (
                        <span className="text-xs text-system-pink dark:text-system-pink-dark mr-1.5">★</span>
                      )}
                      <span className="font-medium">{formatEpochToLocalTime(hour.hourEpoch)}</span>
                    </div>
                    <div className="flex items-center text-xs text-label-secondary dark:text-label-secondary-dark">
                      {/* Use hour.users.length for accurate count */}
                      <span className="mr-1">{hour.users.length}</span>
                      <Users className="w-2.5 h-2.5 opacity-70" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-2 text-label-secondary dark:text-label-secondary-dark text-xs">
            <p>No specific popular times identified</p>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="px-3 py-2 border-t border-separator/20 dark:border-separator-dark/20 bg-gray-50/50 dark:bg-gray-700/20">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap flex-1 overflow-hidden">
              {/* Display usernames */}
              {displayUsernames.slice(0, showAllUsers ? undefined : 2).map((username: string, i: number) => (
                <span key={username + i} className="inline-block mr-1 mb-0.5"> {/* Use username + i for key */}
                  <Badge variant="secondary" className="text-xs font-normal py-0">
                    {username}
                  </Badge>
                </span>
              ))}
              {!showAllUsers && hasMoreUsers && (
                <button
                  onClick={() => setShowAllUsers(true)}
                  className="text-xs text-system-pink dark:text-system-pink-dark hover:underline whitespace-nowrap"
                >
                  +{userNames.length - 2} more
                </button>
              )}
            </div>
            {showAllUsers && (
              <button
                onClick={() => setShowAllUsers(false)}
                className="text-xs text-system-pink dark:text-system-pink-dark flex items-center whitespace-nowrap ml-1"
              >
                Show less
                <ChevronUp className="w-3 h-3 ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Accept participants prop here
const TopAvailability: React.FC<TopAvailabilityProps> = ({ datePopularity, participants }) => {
  const [expandedOnMobile, setExpandedOnMobile] = useState(false);

  const processedDates = useMemo(() => {
    if (!datePopularity || datePopularity.length === 0) {
      return [];
    }

    // Process dates, keeping userIds in the users array for now
    return datePopularity.slice(0, 3).map(date => {
      const isAllDay = !!date.hours &&
                     Object.keys(date.hours).length === 24 &&
                     Object.values(date.hours).every(hourData => hourData.count === date.count);

      let popularHours: Array<{ hourEpoch: number; count: number; users: string[]; percentage: number; }> = [];
      if (date.hours && !isAllDay) {
        popularHours = Object.values(date.hours)
          .map(hourData => ({
            hourEpoch: hourData.hourEpoch,
            count: hourData.count || 0,
            users: hourData.users || [], // Keep userIds here
            percentage: Math.round(((hourData.count || 0) / date.count) * 100) // Ensure count is not undefined
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
      }

      return {
        ...date,
        isAllDay,
        popularHours
      };
    });
  }, [datePopularity]);

  if (!processedDates.length) {
    return (
      <div className="bg-white dark:bg-gray-6-dark rounded-xl p-4 backdrop-blur-md backdrop-saturate-150 border border-white/10 dark:border-white/5">
        <div className="flex items-center justify-center py-3">
          <Clock className="w-5 h-5 text-system-pink dark:text-system-pink-dark opacity-50 mr-2" />
          <p className="text-sm text-label-secondary dark:text-label-secondary-dark">
            No availability data yet
          </p>
        </div>
      </div>
    );
  }

  const visibleDates = processedDates.slice(
    0,
    expandedOnMobile ? 3 : 1
  );

  return (
    <div>
      <div className="md:hidden space-y-2">
        {/* Pass participants down to the card */}
        {visibleDates.map((date, index) => (
          <TopAvailabilityCard key={date.dateEpoch} date={date} index={index} participants={participants} />
        ))}

        {processedDates.length > 1 && (
          <button
            onClick={() => setExpandedOnMobile(!expandedOnMobile)}
            className="w-full py-1.5 px-3 text-center rounded-lg border border-separator/30 dark:border-separator-dark/30 text-label-secondary dark:text-label-secondary-dark text-xs flex items-center justify-center"
          >
            {expandedOnMobile ? (
              <>
                Show top pick only <ChevronUp className="ml-1 w-3 h-3" />
              </>
            ) : (
              <>
                Show all options <ChevronDown className="ml-1 w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="hidden md:grid md:grid-cols-3 gap-3">
        {/* Pass participants down to the card */}
        {processedDates.map((date, index) => (
          <TopAvailabilityCard key={date.dateEpoch} date={date} index={index} participants={participants} />
        ))}
      </div>
    </div>
  );
};

export default TopAvailability;
