// app/(root)/sessions/[id]/page.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useUserData } from '@/context/UserDataContext';
import MovieNightCalendar from '@/components/home/MovieNightCalendar';
import MediaSuggestions from '@/components/sessions/MediaSuggestions';
import { DatePopularity, DateTimeSelection } from '@/types';
import { calculateDatePopularity } from '@/utils/datePopularityCalculator';
import { useParams } from 'next/navigation';
import SessionHeader from '@/components/sessions/SessionHeader';
import TopAvailability from '@/components/sessions/TopAvailability';
import SessionParticipants from '@/components/sessions/SessionParticipants';

const SessionPage = () => {
  const { id } = useParams();
  const { sessions, updateUserDates } = useSession();  
  const { userData } = useUserData();
  
  const session = useMemo(() => sessions.find((s) => s.id === id), [sessions, id]);
  
  const [selectedDates, setSelectedDates] = useState<DateTimeSelection[]>([]);
  const [datePopularity, setDatePopularity] = useState<DatePopularity[]>([]);

  useEffect(() => {
    if (session) {
      setDatePopularity(calculateDatePopularity(session.userDates));
    }
  }, [session]);

  useEffect(() => {
    if (session && userData) {
      const userDates = session.userDates[userData.username] || [];
      setSelectedDates(userDates.map(date => ({
        date: new Date(date.date),
        hours: date.hours === 'all' ? 'all' : date.hours.map(h => new Date(h).getHours())
      })));
    }
  }, [session, userData]);

  if (!session || !userData) {
    return <div className="text-center p-8 text-gray-400">Loading...</div>;
  }

  const handleDatesSelected = async (dates: DateTimeSelection[]) => {
    setSelectedDates(dates);
    if (session && userData) {
      try {
        await updateUserDates(session.id, dates);
      } catch (error) {
        console.error('Error updating dates:', error);
      }
    }
  };

  return (
    <div className="p-2 md:p-4 max-w-7xl mx-auto">
      {/* Session Header */}
      <SessionHeader session={session} datePopularity={datePopularity} />

      <SessionParticipants session={session} />
      
      {/* Calendar Section */}
      <div className="mb-8">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-label dark:text-label-dark">Select Your Availability</h2>
        </div>
        <p className="text-label-secondary dark:text-label-secondary-dark mb-4 text-sm">
          Click on dates to select when you&apos;re available. You can select multiple dates and specific hours.
        </p>
        
          <MovieNightCalendar
            selectedDates={selectedDates}
            onDatesSelected={handleDatesSelected}
            datePopularity={datePopularity}
            activeUsername={userData.username}
            userDates={session.userDates}
          />
      </div>
      
      {/* Top Availability Section */}
      <div className="mb-8">
        <div className="flex items-center ">
          <h2 className="text-xl font-semibold text-label dark:text-label-dark">Top Availability</h2>
        </div>
        <p className="text-label-secondary dark:text-label-secondary-dark mb-4 text-sm">
          These dates have the highest availability among participants. The most popular times are highlighted.
        </p>
        
        <TopAvailability datePopularity={datePopularity} />
      </div>

      {/* Media Suggestions Section */}
      {session?.poll && (
        <div className="mb-8">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-label dark:text-label-dark">Media Suggestions</h2>
          </div>
          <p className="text-label-secondary dark:text-label-secondary-dark mb-4 text-sm">
            Suggest and vote on movies or TV shows for the group to watch together.
          </p>
          
          <MediaSuggestions
            session={session}
            poll={session.poll}
          />
        </div>
      )}
    </div>
  );
};

export default SessionPage;
