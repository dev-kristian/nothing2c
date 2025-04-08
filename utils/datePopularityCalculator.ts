import { format } from 'date-fns';
import { DatePopularity } from '@/types';

export const calculateDatePopularity = (userDates: { [username: string]: { date: string, hours: string[] | 'all' }[] }): DatePopularity[] => {
  const popularity: { [key: string]: Omit<DatePopularity, 'hours'> & { hours: string[] | 'all', hourlyDetails: Record<string, { count: number; users: string[] }> } } = {};

  Object.entries(userDates).forEach(([username, dates]) => {
    dates.forEach(date => {
      const dateString = format(new Date(date.date), 'yyyy-MM-dd');

      if (!popularity[dateString]) {
        popularity[dateString] = {
          date: dateString,
          count: 0,
          users: [],
          hours: date.hours, 
          hourlyDetails: {}
        };
      }

      popularity[dateString].count++;
      if (!popularity[dateString].users.includes(username)) {
          popularity[dateString].users.push(username);
      }


      const currentHourlyDetails = popularity[dateString].hourlyDetails;

      if (Array.isArray(date.hours)) {
        date.hours.forEach(hourString => {
          const hourKey = new Date(hourString).getHours().toString();
          if (!currentHourlyDetails[hourKey]) {
            currentHourlyDetails[hourKey] = { count: 0, users: [] };
          }
          currentHourlyDetails[hourKey].count++;
          if (!currentHourlyDetails[hourKey].users.includes(username)) {
              currentHourlyDetails[hourKey].users.push(username);
          }
        });
      } else if (date.hours === 'all') {
        for (let i = 0; i < 24; i++) {
          const hourKey = i.toString();
          if (!currentHourlyDetails[hourKey]) {
            currentHourlyDetails[hourKey] = { count: 0, users: [] };
          }
          currentHourlyDetails[hourKey].count++;
           if (!currentHourlyDetails[hourKey].users.includes(username)) {
               currentHourlyDetails[hourKey].users.push(username);
           }
        }
      }

      const currentAggregatedHours = popularity[dateString].hours;

      if (date.hours === 'all') {
        popularity[dateString].hours = 'all';
      } else if (Array.isArray(date.hours) && Array.isArray(currentAggregatedHours)) {
        const combinedHours = new Set([...currentAggregatedHours, ...date.hours]);
        popularity[dateString].hours = Array.from(combinedHours);
      }
    });
  });

  const result: DatePopularity[] = Object.values(popularity);
  return result.sort((a, b) => b.count - a.count);
};
