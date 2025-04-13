'use client'

import React, { useState, useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  Filter, 
  Plus, 
  Film, 
  Clock,
  ChevronDown
} from 'lucide-react';
import MovieNightInvitation from '@/components/home/MovieNightInvitation';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/context/AuthUserContext'; // Updated import
import { countParticipantsByStatus } from '@/utils/sessionUtils';
import { formatEpochToLocalDate } from '@/lib/dateTimeUtils';

const SessionsPage = () => {
  const { sessions, isLoading } = useSession();
  const { userData } = useAuthUser(); // Use new hook
  const searchParams = useSearchParams();
  const router = useRouter();
  const showNewSession = searchParams.get('new') === 'true';
  const [filter, setFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredSessions = useMemo(() => {
    if (filter === 'all') return sessions;
    return sessions.filter(session => session.status === filter);
  }, [sessions, filter]);

  const sortedSessions = useMemo(() => {
    return [...filteredSessions].sort((a, b) => b.createdAtEpoch - a.createdAtEpoch); 
  }, [filteredSessions]);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-medium">Sessions</h1>
          <span className="text-sm text-foreground/60">
            ({filteredSessions.length})
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded-lg hover:bg-foreground/5"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{filter === 'all' ? 'All' : filter}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            
            {isFilterOpen && (
              <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg shadow-lg frosted-panel p-1">
                <button 
                  onClick={() => { setFilter('all'); setIsFilterOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${filter === 'all' ? 'bg-pink text-white' : 'hover:bg-foreground/10'}`}
                >
                  All Sessions
                </button>
                <button 
                  onClick={() => { setFilter('active'); setIsFilterOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${filter === 'active' ? 'bg-pink text-white' : 'hover:bg-foreground/10'}`}
                >
                  Active Sessions
                </button>
                <button 
                  onClick={() => { setFilter('completed'); setIsFilterOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${filter === 'completed' ? 'bg-pink text-white' : 'hover:bg-foreground/10'}`}
                >
                  Completed Sessions
                </button>
              </div>
            )}
          </div>
          
          <Button 
            onClick={() => router.push('/watch-together?new=true')}
            size="sm"
            className="bg-pink hover:bg-pink-hover text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>New</span>
          </Button>
        </div>
      </div>

      {showNewSession && (
        <MovieNightInvitation />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-t-2 border-pink rounded-full animate-spin"></div>
        </div>
      ) : sortedSessions.length === 0 ? (
        <div className="frosted-panel rounded-lg p-4 text-center">
          <Calendar className="w-6 h-6 mx-auto mb-2 text-foreground/40" />
          <p className="text-sm text-foreground/70">
            {filter !== 'all' 
              ? `No ${filter} sessions found`
              : 'Create your first movie night session'}
          </p>
          <Button 
            onClick={() => router.push('/watch-together?new=true')}
            size="sm"
            className="mt-2 bg-pink hover:bg-pink-hover text-white"
          >
            Create Session
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSessions.map((session) => {
            const { accepted, pending } = countParticipantsByStatus(session.participants);
            const isInvited = session.participants?.[userData?.uid || '']?.status === 'invited';
            
            return (
              <Link 
                key={session.id} 
                href={`/watch-together/${session.id}`}
                className="block frosted-panel rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium truncate">
                          Movie Night with {session.createdBy}
                        </h3>
                        
                        <div className="flex flex-shrink-0 gap-1">
                          {isInvited && (
                            <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              Invited
                            </span>
                          )}
                          
                          <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                            session.status === 'active'
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                              : 'bg-foreground/10 text-foreground/70'
                          }`}>
                            {session.status === 'active' ? 'Active' : 'Completed'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center text-xs text-foreground/60 gap-x-4 gap-y-1">
                        <div className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {format(new Date(session.createdAtEpoch), 'MMM d')}
                        </div>
                        
                        <div className="flex items-center">
                          <Users className="w-3.5 h-3.5 mr-1" />
                          {accepted} confirmed
                          {pending > 0 && `, ${pending} pending`}
                        </div>
                        
                        {session.aggregatedAvailability && session.aggregatedAvailability.length > 0 && (
                          <div className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            {formatEpochToLocalDate(session.aggregatedAvailability[0].dateEpoch)}
                          </div>
                        )}
                        
                        {session.poll && session.poll.movieTitles.length > 0 && (
                          <div className="flex items-center">
                            <Film className="w-3.5 h-3.5 mr-1" />
                            {session.poll.movieTitles.length} options
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-foreground/40">
                      <ChevronDown className="w-5 h-5 rotate-270" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SessionsPage;
