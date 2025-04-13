import { DateTimeSelection, UserDate } from '@/types';

export const localSelectionsToUTCEpoch = (selections: DateTimeSelection[]): UserDate[] => {
  return selections
    .map(selection => {
      if (!(selection.date instanceof Date) || isNaN(selection.date.getTime())) {
        return null;
      }
      const date = selection.date;
      const dateEpoch = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

      if (isNaN(dateEpoch)) {
          return null;
      }

      let hoursEpoch: number[] = [];
      if (Array.isArray(selection.hours)) {
         hoursEpoch = selection.hours
           .map(hour => {
             if (typeof hour !== 'number' || hour < 0 || hour > 23) {
               return NaN;
             }
             // Create the Date object representing the LOCAL time, then get its epoch value
             const localHourDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);
             return localHourDate.getTime(); 
           })
           .filter(epoch => !isNaN(epoch) && epoch !== null) // Ensure getTime() didn't fail
           .sort((a, b) => a - b);
      }

      return { dateEpoch, hoursEpoch };
    })
    .filter((entry): entry is UserDate => entry !== null);
};

export const utcEpochToLocalSelections = (userDates: UserDate[]): DateTimeSelection[] => {
  return userDates
    .map(epochDate => {
      if (!epochDate || typeof epochDate.dateEpoch !== 'number' || !Array.isArray(epochDate.hoursEpoch)) {
          return null;
      }
      
      const dateObj = new Date(epochDate.dateEpoch); 
      if (isNaN(dateObj.getTime())) {
          return null;
      }

      const hours: number[] = epochDate.hoursEpoch
           .map(hourEpoch => {
             if (typeof hourEpoch !== 'number' || isNaN(hourEpoch)) {
               return NaN; 
             }
             const hourDateObj = new Date(hourEpoch);
             if (isNaN(hourDateObj.getTime())) {
               return NaN; 
              }
              return hourDateObj.getHours(); 
            })
            .filter(h => !isNaN(h)) 
            .sort((a, b) => a - b); 

      return { date: dateObj, hours };
    })
    .filter((entry): entry is DateTimeSelection => entry !== null); 
};


export const getUTCDayEpochFromDate = (date: Date): number => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return NaN;
  }
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
};

export const getUTCHourEpochFromDateAndHour = (date: Date, hour: number): number => {
   if (!(date instanceof Date) || isNaN(date.getTime())) {
    return NaN;
  }
   if (typeof hour !== 'number' || hour < 0 || hour > 23) {
    return NaN;
  }
  // Create a new Date object representing the specific local date and hour
  const localDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);
  if (isNaN(localDateTime.getTime())) {
      return NaN;
  }
  // Return the epoch timestamp (milliseconds since UTC epoch) for this specific point in time
  return localDateTime.getTime();
};


export const getLocalHourFromUTCEpoch = (epoch: number): number => {
  if (typeof epoch !== 'number' || isNaN(epoch)) {
     return NaN;
  }
  const date = new Date(epoch);
  if (isNaN(date.getTime())) {
     return NaN;
  }
  return date.getHours();
};

export const formatEpochToLocalDateTime = (epoch: number): string => {
  if (typeof epoch !== 'number' || isNaN(epoch)) {
    return 'Invalid Date';
  }
  const date = new Date(epoch);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return date.toLocaleString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export const formatEpochToLocalDate = (epoch: number): string => {
  if (typeof epoch !== 'number' || isNaN(epoch)) {
    return 'Invalid Date';
  }
  const date = new Date(epoch);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export const formatEpochToLocalTime = (epoch: number): string => {
  if (typeof epoch !== 'number' || isNaN(epoch)) {
    return 'Invalid Time';
  }
  const date = new Date(epoch);
  if (isNaN(date.getTime())) {
    return 'Invalid Time';
  }
  return date.toLocaleTimeString(undefined, { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};
