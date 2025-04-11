import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Users, Clock } from 'lucide-react';
import { DatePopularity } from '@/types';
import { motion } from 'framer-motion';

interface TopAvailabilityProps {
  datePopularity: DatePopularity[];
}

interface PopularHour {
  hour: number;
  count: number;
}

interface HourData {
  count: number;
}

const TopAvailability: React.FC<TopAvailabilityProps> = ({ datePopularity }) => {

  // Helper function (can remain outside useMemo)
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  };

  const topDatesWithHours = useMemo(() => {
    const getPopularHours = (date: DatePopularity): PopularHour[] => {
      if (!date.hours || Object.keys(date.hours).length === 0) {
        return [];
      }
      return Object.entries(date.hours)
        .map(([hour, hourData]) => ({
          hour: parseInt(hour),
          count: ((hourData as unknown) as HourData).count || 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    };

    return datePopularity.slice(0, 3).map(date => ({
      ...date,
      popularHours: getPopularHours(date) 
    }));
  }, [datePopularity]);

  if (!topDatesWithHours.length) {
    return (
      <div className="bg-white dark:bg-gray-6-dark rounded-2xl p-6 backdrop-blur-md backdrop-saturate-150 border border-white/10 dark:border-white/5">
        <div className="flex flex-col items-center justify-center py-6">
          <Clock className="w-8 h-8 text-system-pink dark:text-system-pink-dark opacity-50 mb-3" />
          <p className="text-label-secondary dark:text-label-secondary-dark text-center">
            No availability data yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topDatesWithHours.map((date, index) => {
          const { popularHours } = date;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-6-dark backdrop-blur-md 
                        rounded-xl overflow-hidden border border-white/10 dark:border-white/5
                        transition-all duration-200 hover:shadow-sm"
            >
              <div className="px-4 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-base text-label dark:text-label-dark">
                      {format(new Date(date.date), 'EEE, MMM d')}
                    </h4>
                    <div className="flex items-center mt-1 text-label-secondary dark:text-label-secondary-dark text-sm">
                      <Users className="w-3.5 h-3.5 mr-1" />
                      <span>{date.count} {date.count === 1 ? 'person' : 'people'}</span>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-system-pink/10 dark:bg-system-pink-dark/15">
                    <span className="text-xs font-medium text-system-pink dark:text-system-pink-dark">
                      #{index + 1}
                    </span>
                  </div>
                </div>
                
                {popularHours.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-separator/20 dark:border-separator-dark/20">
                    <div className="flex items-center text-xs text-label-secondary dark:text-label-secondary-dark mb-2.5">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Popular times</span>
                    </div>
                    
                    <div className="flex space-x-2 mt-2 overflow-x-auto no-scrollbar pb-1">
                      {popularHours.map((hourData, i) => {
                        const isTopPick = i === 0;
                        
                        return (
                          <div 
                            key={hourData.hour}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                                      ${isTopPick 
                                        ? 'bg-system-pink/15 dark:bg-system-pink-dark/20 text-system-pink dark:text-system-pink-dark border border-system-pink/20 dark:border-system-pink-dark/20' 
                                        : 'bg-gray-6 dark:bg-gray-5-dark text-label-secondary dark:text-label-secondary-dark'}`}
                          >
                            {formatHour(hourData.hour)}
                            {isTopPick && <span className="ml-1">★</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {date.users.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-separator/20 dark:border-separator-dark/20 text-xs text-label-secondary dark:text-label-secondary-dark">
                    People: 
                    <span className="text-system-pink dark:text-system-pink-dark ml-1">
                      {date.users.length > 2 
                        ? `${date.users.slice(0, 2).join(', ')} +${date.users.length - 2}` 
                        : date.users.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TopAvailability;
