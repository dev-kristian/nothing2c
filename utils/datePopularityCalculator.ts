import { format, getHours } from 'date-fns';
import { DatePopularity } from '@/types';

type HourlyCounts = Record<string, { count: number; users: string[] }>;

type PopularityAccumulator = Omit<DatePopularity, 'hours'> & {
  hours: HourlyCounts; 
};

export const calculateDatePopularity = (userDates: { [username: string]: { date: string, hours: string[] | 'all' }[] }): DatePopularity[] => {
  const popularity: { [key: string]: PopularityAccumulator } = {};

  Object.entries(userDates).forEach(([username, dates]) => {
    dates.forEach(date => {
      const dateString = format(new Date(date.date), 'yyyy-MM-dd');

      if (!popularity[dateString]) {
        popularity[dateString] = {
          date: dateString,
          count: 0,
          users: [],
          hours: {} 
        };
      }

      popularity[dateString].count++;
      if (!popularity[dateString].users.includes(username)) {
          popularity[dateString].users.push(username);
      }

      const currentHourlyCounts = popularity[dateString].hours;

      if (Array.isArray(date.hours)) {
        date.hours.forEach(hourTimestampString => {
          const hourDate = new Date(hourTimestampString);
          if (!isNaN(hourDate.getTime())) {
            const hourKey = getHours(hourDate).toString();
            if (!currentHourlyCounts[hourKey]) {
              currentHourlyCounts[hourKey] = { count: 0, users: [] };
            }
            currentHourlyCounts[hourKey].count++;
            if (!currentHourlyCounts[hourKey].users.includes(username)) {
              currentHourlyCounts[hourKey].users.push(username);
            }
          } else {
            console.warn(`Invalid date string encountered: ${hourTimestampString}`);
          }
        });
      } else if (date.hours === 'all') {
        for (let i = 0; i < 24; i++) {
          const hourKey = i.toString();
          if (!currentHourlyCounts[hourKey]) {
            currentHourlyCounts[hourKey] = { count: 0, users: [] };
          }
          currentHourlyCounts[hourKey].count++;
          if (!currentHourlyCounts[hourKey].users.includes(username)) {
            currentHourlyCounts[hourKey].users.push(username);
          } 
        }
      } 
    });
  }); 

  const result: DatePopularity[] = Object.values(popularity);
  
  return result.sort((a, b) => b.count - a.count);
};
