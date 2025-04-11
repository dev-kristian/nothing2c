import React, { useState, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Info, Calendar, Film, Users, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Session, DatePopularity } from '@/types';

interface SessionHeaderProps {
  session: Session;
  datePopularity: DatePopularity[];
}

const SessionHeader: React.FC<SessionHeaderProps> = ({ session, datePopularity }) => {
  const [showInfo, setShowInfo] = useState(false);
  const daysAgo = differenceInDays(new Date(), new Date(session.createdAt));
  
  // Calculate most popular date
  const topDate = datePopularity.length > 0 ? datePopularity[0] : null;

  // Memoize the calculation for the most voted movie
  const topMovie = useMemo(() => {
    // Check if poll exists before accessing its properties
    if (!session.poll || !session.poll.movieTitles || session.poll.movieTitles.length === 0) {
      return null;
    }

    let maxVotes = 0;
    let topMovie = '';

    // Use optional chaining here to satisfy TS, even though the check above should guarantee existence
    session.poll?.movieTitles.forEach(movie => {
      const voteCount = Object.values(session.poll?.votes || {}).reduce(
        (count, userVotes) => count + (userVotes.includes(movie) ? 1 : 0),
        0
      );
      
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        topMovie = movie;
      }
    });
    
    return { title: topMovie, votes: maxVotes };
    // Depend on the poll object itself, which might be undefined initially
  }, [session.poll]);

  // Count participants
  const participantCount = Object.keys(session.participants || {}).length;
  
  // Format date for display
  const formattedDate = format(new Date(session.createdAt), 'MMMM d, yyyy');

  return (
    <div className="pt-4 sm:pt-8">
      {/* Main header with subtle gradient background */}
      <div className="rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-md backdrop-saturate-150 border border-white/10 dark:border-white/5 shadow-apple-sm dark:shadow-apple-dark-sm">
        <div className="bg-white dark:bg-gray-6-dark px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-label dark:text-label-dark">
              Movie Night
            </h1>
            <motion.button
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full 
                        flex items-center justify-center text-gray dark:text-gray-dark
                        transition-all duration-300"
              onClick={() => setShowInfo(!showInfo)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Show information"
            >
              <Info size={18} className="sm:hidden" />
              <Info size={20} className="hidden sm:block" />
            </motion.button>
          </div>
          
          <div className="flex flex-wrap items-center mt-2 text-xs sm:text-sm text-label-secondary dark:text-label-secondary-dark">
            <div className="flex items-center mr-2 sm:mr-0">
              <span className="mr-1">Created by</span>
              <span className="font-medium text-system-pink dark:text-system-pink-dark">
                {session.createdBy}
              </span>
            </div>
            
            <span className="hidden sm:block mx-1.5 text-label-tertiary dark:text-label-tertiary-dark">•</span>
            
            <div className="flex items-center w-full sm:w-auto mt-1 sm:mt-0">
              <Clock className="size-4 mr-1.5 opacity-70" />
              <span>{formattedDate}</span>
              <span className="ml-1 text-label-tertiary dark:text-label-tertiary-dark">
                ({daysAgo} day{daysAgo !== 1 ? 's' : ''} ago)
              </span>
            </div>
          </div>
          
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4 overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-separator/50 dark:border-separator-dark/50">
                  <div className="flex items-start">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-system-blue/10 dark:bg-system-blue-dark/15 text-system-blue dark:text-system-blue-dark mr-3">
                      <Users size={16} className="sm:hidden" />
                      <Users size={18} className="hidden sm:block" />
                    </div>
                    <div>
                      <p className="text-label-secondary dark:text-label-secondary-dark text-xs sm:text-sm font-medium">
                        Participants
                      </p>
                      <p className="text-label dark:text-label-dark text-sm sm:text-base font-semibold mt-0.5 sm:mt-1">
                        {participantCount} {participantCount === 1 ? 'person' : 'people'}
                      </p>
                    </div>
                  </div>
                  
                  {topDate && (
                    <div className="flex items-start">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-system-green/10 dark:bg-system-green-dark/15 text-system-green dark:text-system-green-dark mr-3">
                        <Calendar size={16} className="sm:hidden" />
                        <Calendar size={18} className="hidden sm:block" />
                      </div>
                      <div>
                        <p className="text-label-secondary dark:text-label-secondary-dark text-xs sm:text-sm font-medium">
                          Most popular date
                        </p>
                        <p className="text-label dark:text-label-dark text-sm sm:text-base font-semibold mt-0.5 sm:mt-1">
                          {format(new Date(topDate.date), 'EEE, MMM d')}
                          <span className="hidden sm:inline">
                            {format(new Date(topDate.date), ', yyyy')}
                          </span>
                        </p>
                        <p className="text-[10px] sm:text-xs text-label-tertiary dark:text-label-tertiary-dark mt-0.5">
                          {topDate.count} {topDate.count === 1 ? 'person' : 'people'} available
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {topMovie && (
                    <div className="flex items-start">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-system-purple/10 dark:bg-system-purple-dark/15 text-system-purple dark:text-system-purple-dark mr-3">
                        <Film size={16} className="sm:hidden" />
                        <Film size={18} className="hidden sm:block" />
                      </div>
                      <div>
                        <p className="text-label-secondary dark:text-label-secondary-dark text-xs sm:text-sm font-medium">
                          Top voted movie
                        </p>
                        <p className="text-label dark:text-label-dark text-sm sm:text-base font-semibold mt-0.5 sm:mt-1 line-clamp-1">
                          {topMovie.title}
                        </p>
                        <p className="text-[10px] sm:text-xs text-label-tertiary dark:text-label-tertiary-dark mt-0.5">
                          {topMovie.votes} {topMovie.votes === 1 ? 'vote' : 'votes'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Collapsible indicator */}
      <div className="flex justify-center">
        <motion.button
          onClick={() => setShowInfo(!showInfo)}
          className="mt-1 sm:mt-2 w-8 h-4 flex items-center justify-center text-label-tertiary dark:text-label-tertiary-dark"
          animate={{ rotate: showInfo ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
        </motion.button>
      </div>
    </div>
  );
};

export default SessionHeader;
