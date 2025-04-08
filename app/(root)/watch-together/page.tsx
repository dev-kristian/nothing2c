'use client'

import React, { useState, useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { format } from 'date-fns';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Filter, Plus, Film, Clock, ChevronDown, UserCheck, Clock1 } from 'lucide-react';
import MovieNightInvitation from '@/components/home/MovieNightInvitation';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/context/UserDataContext';
import { formatHours, countParticipantsByStatus } from '@/utils/sessionUtils';

const SessionsPage = () => {
  const { sessions, isLoading } = useSession();
  const { userData } = useUserData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const showNewSession = searchParams.get('new') === 'true';
  const [filter, setFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (filter === 'all') return true;
      return session.status === filter;
    });
  }, [sessions, filter]);

  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredSessions]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setIsFilterOpen(false);
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 sm:px-6 space-y-6 pt-16 pb-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="text-center w-full mb-3 sm:mb-4 md:mb-6"
      >
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-gray dark:text-gray-dark text-xs sm:text-sm font-medium mb-1"
        >
          {userData ? (
            <>
              Ready to
              plan a movie night?
            </>
          ) : (
            "Welcome to Watch Together"
          )}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.1,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="font-semibold tracking-tight text-lg sm:text-xl md:text-2xl lg:text-4xl mb-3 sm:mb-4 md:mb-6"
        >
          <span className="text-gray-5-dark dark:text-gray-5">Watch Movies </span>
          <span className="text-pink dark:text-pink-dark font-semibold">Together</span>
        </motion.div>
      </motion.div>

      {showNewSession && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <MovieNightInvitation />
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 rounded-xl mb-4">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center space-x-2 px-3 py-2 frosted-panel"
            >
              <Filter className="w-4 h-4 text-gray dark:text-gray-dark" />
              <span className="text-sm font-medium">
                {filter === 'all' ? 'All Sessions' : 
                 filter === 'active' ? 'Active Sessions' : 
                 filter === 'completed' ? 'Completed Sessions' : 
                 'Filter Sessions'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray dark:text-gray-dark" />
            </button>
            
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-10 mt-2 w-48 rounded-xl shadow-lg p-1 frosted-panel space-y-1"
                >
                  <button 
                    onClick={() => handleFilterChange('all')}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${filter === 'all' ? 'bg-pink text-white' : 'hover:bg-foreground/10'}`}
                  >
                    All Sessions
                  </button>
                  <button 
                    onClick={() => handleFilterChange('active')}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${filter === 'active' ? 'bg-pink text-white' : 'hover:bg-foreground/10'}`}
                  >
                    Active Sessions
                  </button>
                  <button 
                    onClick={() => handleFilterChange('completed')}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${filter === 'completed' ? 'bg-pink text-white' : 'hover:bg-foreground/10'}`}
                  >
                    Completed Sessions
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray dark:text-gray-dark">
              {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
            </div>
            
            {!showNewSession && (
              <Link href="/watch-together?new=true">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300
                            button-neutral flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Session</span>
                </motion.button>
              </Link>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center py-32"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-t-2 border-pink animate-spin"></div>
                </div>
                <p className="text-gray dark:text-gray-dark text-sm">Loading sessions...</p>
              </div>
            </motion.div>
          ) : !isLoading && sortedSessions.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="frosted-panel rounded-xl text-center py-24 px-4"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-foreground/5 border border-foreground/10">
                  <Calendar className="w-10 h-10 text-foreground/40" />
                </div>
                <h3 className="text-xl font-semibold text-foreground/90">No Sessions Found</h3>
                <p className="text-foreground/60 max-w-md">
                  {filter !== 'all' 
                    ? `No ${filter} sessions found. Try changing the filter or create a new session.`
                    : 'Start planning your movie night by creating a new session!'}
                </p>
                <Button 
                  onClick={() => router.push('/watch-together?new=true')}
                  className="mt-2 bg-pink hover:bg-pink-hover text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Session
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="sessions"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4"
            >
              {sortedSessions.map((session) => {
                const { accepted, pending} = countParticipantsByStatus(session.participants);
                
                return (
                  <motion.div
                    key={session.id}
                    variants={itemVariants}
                    className="frosted-panel rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                  >
                    <Link href={`/watch-together/${session.id}`} className="block">
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                          <div className="space-y-3 flex-grow max-w-2xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-5-dark dark:text-gray">
                                Movie Night with {session.createdBy}
                              </h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                session.status === 'active' 
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                                  : 'bg-foreground/10 text-foreground/70'
                              }`}>
                                {session.status === 'active' ? 'Active' : 
                                 session.status === 'completed' ? 'Completed' : session.status}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center text-foreground/60">
                                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                                Created {format(new Date(session.createdAt), 'MMM d, yyyy')}
                              </div>
                              
                              <div className="flex items-center text-foreground/60">
                                <UserCheck className="w-4 h-4 mr-2 flex-shrink-0" />
                                {accepted} confirmed
                              </div>
                              
                              {pending > 0 && (
                                <div className="flex items-center text-foreground/60">
                                  <Clock1 className="w-4 h-4 mr-2 flex-shrink-0" />
                                  {pending} pending
                                </div>
                              )}
                            </div>
                            
                            {session.poll && (
                              <div className="pt-3 border-t border-foreground/10">
                                <div className="flex items-center space-x-2 text-foreground/70 mb-2">
                                  <Film className="w-4 h-4 flex-shrink-0" />
                                  <p className="text-sm font-medium">
                                    Movie Poll ({session.poll.movieTitles.length})
                                  </p>
                                </div>
                                
                                {session.poll.movieTitles.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {session.poll.movieTitles.slice(0, 3).map((title, index) => (
                                      <span key={index} className="px-2 py-1 bg-foreground/10 text-xs rounded-full text-foreground/80">
                                        {title.length > 20 ? `${title.substring(0, 20)}...` : title}
                                      </span>
                                    ))}
                                    {session.poll.movieTitles.length > 3 && (
                                      <span className="px-2 py-1 bg-foreground/10 text-xs rounded-full text-foreground/80">
                                        +{session.poll.movieTitles.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="lg:w-80 space-y-4 lg:border-l lg:border-foreground/10 lg:pl-6">
                            {session.userDates && Object.keys(session.userDates).length > 0 && (
                              <div>
                                <div className="flex items-center space-x-2 text-foreground/70 mb-2">
                                  <Calendar className="w-4 h-4 flex-shrink-0" />
                                  <p className="text-sm font-medium">Potential Dates</p>
                                </div>
                                
                                <div className="space-y-2">
                                  {Object.entries(session.userDates).slice(0, 2).map(([username, dates]) => (
                                    <div key={username} className="bg-foreground/10 rounded-lg p-2">
                                      <p className="text-xs font-medium mb-1">{username}&apos;s availability:</p>
                                      <div className="space-y-1.5">
                                        {Array.isArray(dates) && dates.slice(0, 2).map((dateInfo, index) => {
                                          const dateObj = new Date(dateInfo.date);
                                          return (
                                            <div key={index} className="flex items-center text-xs text-foreground/70">
                                              <span className="font-medium">{format(dateObj, 'EEE, MMM d')}: </span>
                                              <span className="ml-1">
                                                {Array.isArray(dateInfo.hours) 
                                                  ? formatHours(dateInfo.hours)
                                                  : dateInfo.hours === 'all' ? 'All day' : dateInfo.hours}
                                              </span>
                                            </div>
                                          );
                                        })}
                                        {Array.isArray(dates) && dates.length > 2 && (
                                          <div className="text-xs text-foreground/60 italic">
                                            +{dates.length - 2} more dates
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {Object.keys(session.userDates).length > 2 && (
                                    <div className="text-xs text-foreground/60 italic text-center">
                                      +{Object.keys(session.userDates).length - 2} more people with availability
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {session.participants && Object.keys(session.participants).length > 0 && (
                              <div className="hidden lg:block">
                                <div className="flex items-center space-x-2 text-foreground/70 mb-2">
                                  <Users className="w-4 h-4 flex-shrink-0" />
                                  <p className="text-sm font-medium">Participants</p>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(session.participants).slice(0, 6).map(([id, participant]: [string, { username: string; status: 'invited' | 'accepted' | 'declined'; }]) => (
                                    <span 
                                      key={id}
                                      className="px-2 py-1 bg-foreground/10 text-xs rounded-full text-foreground/80 flex items-center"
                                      title={`${participant.username} (${participant.status})`}
                                    >
                                      {participant.username}
                                      {participant.status === 'accepted' && (
                                        <span className="ml-1 w-2 h-2 bg-green-400 rounded-full"></span>
                                      )}
                                      {participant.status === 'declined' && (
                                        <span className="ml-1 w-2 h-2 bg-red-400 rounded-full"></span>
                                      )}
                                      {participant.status === 'invited' && (
                                        <span className="ml-1 w-2 h-2 bg-amber-400 rounded-full"></span>
                                      )}
                                    </span>
                                  ))}
                                  {Object.keys(session.participants).length > 6 && (
                                    <span className="px-2 py-1 bg-foreground/10 text-xs rounded-full text-foreground/80">
                                      +{Object.keys(session.participants).length - 6} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {session.participants && Object.keys(session.participants).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-foreground/10 lg:hidden">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-foreground/70">
                                <Users className="w-4 h-4 flex-shrink-0" />
                                <p className="text-sm font-medium">Participants</p>
                              </div>
                              <span className="text-xs text-foreground/60">
                                {accepted} confirmed, {pending} pending
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Object.entries(session.participants).slice(0, 8).map(([id, participant]: [string, { username: string; status: 'invited' | 'accepted' | 'declined'; }]) => (
                                <span 
                                  key={id}
                                  className="px-2 py-1 bg-foreground/10 text-xs rounded-full text-foreground/80 flex items-center"
                                  title={`${participant.username} (${participant.status})`}
                                >
                                  {participant.username}
                                  {participant.status === 'accepted' && (
                                    <span className="ml-1 w-2 h-2 bg-green-400 rounded-full"></span>
                                  )}
                                  {participant.status === 'declined' && (
                                    <span className="ml-1 w-2 h-2 bg-red-400 rounded-full"></span>
                                  )}
                                  {participant.status === 'invited' && (
                                    <span className="ml-1 w-2 h-2 bg-amber-400 rounded-full"></span>
                                  )}
                                </span>
                              ))}
                              {Object.keys(session.participants).length > 8 && (
                                <span className="px-2 py-1 bg-foreground/10 text-xs rounded-full text-foreground/80">
                                  +{Object.keys(session.participants).length - 8} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-white dark:bg-black/50 py-2 px-6 text-center text-sm text-foreground/50 border-t border-foreground/10">
                        View session details
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-8"
      >
        <h3 className="text-sm font-medium text-gray dark:text-gray-dark mb-3 text-center">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="frosted-panel rounded-xl p-4 flex flex-col items-center text-center">
            <Calendar className="w-6 h-6 mb-2 text-pink" />
            <h4 className="text-sm font-medium mb-1">Suggest Dates</h4>
            <p className="text-xs text-gray dark:text-gray-dark">Propose multiple dates and times to find when everyone is available</p>
          </div>
          <div className="frosted-panel rounded-xl p-4 flex flex-col items-center text-center">
            <Film className="w-6 h-6 mb-2 text-pink" />
            <h4 className="text-sm font-medium mb-1">Vote on Movies</h4>
            <p className="text-xs text-gray dark:text-gray-dark">Add movies to the poll and let everyone vote for their favorites</p>
          </div>
          <div className="frosted-panel rounded-xl p-4 flex flex-col items-center text-center">
            <Users className="w-6 h-6 mb-2 text-pink" />
            <h4 className="text-sm font-medium mb-1">Invite Friends</h4>
            <p className="text-xs text-gray dark:text-gray-dark">Send invitations to friends so they can join your watch party</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(SessionsPage);
