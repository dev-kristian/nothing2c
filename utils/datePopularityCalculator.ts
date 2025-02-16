import { format } from 'date-fns';
import { DatePopularity } from '@/types';

export const calculateDatePopularity = (userDates: { [username: string]: { date: string, hours: string[] | 'all' }[] }): DatePopularity[] => {
  const popularity: { [key: string]: DatePopularity } = {};

  Object.entries(userDates).forEach(([username, dates]) => {
    dates.forEach(date => {
      const dateString = format(new Date(date.date), 'yyyy-MM-dd');
      if (!popularity[dateString]) {
        popularity[dateString] = { date: dateString, count: 0, users: [], hours: {} };
      }
      popularity[dateString].count++;
      popularity[dateString].users.push(username);

      if (Array.isArray(date.hours)) {
        date.hours.forEach(hour => {
          const hourNumber = new Date(hour).getHours();
          if (!popularity[dateString].hours[hourNumber]) {
            popularity[dateString].hours[hourNumber] = { count: 0, users: [] };
          }
          popularity[dateString].hours[hourNumber].count++;
          popularity[dateString].hours[hourNumber].users.push(username);
        });
      } else if (date.hours === 'all') {
        for (let i = 0; i < 24; i++) {
          if (!popularity[dateString].hours[i]) {
            popularity[dateString].hours[i] = { count: 0, users: [] };
          }
          popularity[dateString].hours[i].count++;
          popularity[dateString].hours[i].users.push(username);
        }
      }
    });
  });

  return Object.values(popularity).sort((a, b) => b.count - a.count);
};