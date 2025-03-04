'use client'

import React, { useState, useMemo } from 'react';
import { useSession } from '@/context/SessionContext';
import { format } from 'date-fns';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Filter, Plus, Film, Clock } from 'lucide-react';
import MovieNightInvitation from '@/components/home/MovieNightInvitation';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SessionsPage = () => {
  const { sessions } = useSession();
  const searchParams = useSearchParams();
  const showNewSession = searchParams.get('new') === 'true';
  const [filter, setFilter] = useState('all');

  // Memoize filtered sessions to prevent unnecessary recalculations
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (filter === 'all') return true;
      return session.status === filter;
    });
  }, [sessions, filter]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 pt-16">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Movie Night Sessions
        </h1>
        
        {!showNewSession && (
          <Link href="/watch-together?new=true">
            <Button className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
              <Plus className="w-4 h-4" />
              <span>New Session</span>
            </Button>
          </Link>
        )}
      </div>

      {showNewSession && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-8"
        >
          <MovieNightInvitation />
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter sessions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-gray-400">
          {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
        </div>
      </div>

      <AnimatePresence>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-4"
        >
          {filteredSessions.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="text-center p-12 bg-gray-900/30 rounded-xl border border-gray-800"
            >
              <div className="flex flex-col items-center space-y-4">
                <Calendar className="w-12 h-12 text-gray-500" />
                <h3 className="text-xl font-semibold text-gray-300">No Sessions Found</h3>
                <p className="text-gray-400 max-w-md">
                  {filter !== 'all' 
                    ? `No ${filter} sessions found. Try changing the filter or create a new session.`
                    : 'Start planning your movie night by creating a new session!'}
                </p>
              </div>
            </motion.div>
          ) : (
            filteredSessions.map((session) => (
              <motion.div
                key={session.id}
                variants={itemVariants}
                className="bg-gradient-to-br from-gray-900 to-gray-800/50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-800/50 hover:border-gray-700/50"
              >
                <Link href={`/watch-together/${session.id}`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <p className="text-xl font-semibold text-white">
                          Session by {session.createdBy}
                        </p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          session.status === 'active' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      
                      <div className="flex space-x-6">
                        <div className="flex items-center text-gray-400">
                          <Clock className="w-4 h-4 mr-2" />
                          {format(new Date(session.createdAt), 'PPP')}
                        </div>
                        <div className="flex items-center text-gray-400">
                          <Users className="w-4 h-4 mr-2" />
                          {Object.keys(session.userDates).length} participant{Object.keys(session.userDates).length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  {session.poll && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Film className="w-4 h-4" />
                        <p className="text-sm">
                          {session.poll.movieTitles.length} movie{session.poll.movieTitles.length !== 1 ? 's' : ''} in poll • {' '}
                          {Object.keys(session.poll.votes).length} vote{Object.keys(session.poll.votes).length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </Link>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default React.memo(SessionsPage);