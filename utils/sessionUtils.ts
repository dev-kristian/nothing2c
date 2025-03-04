// src/utils/sessionUtils.ts

import { format } from 'date-fns';

/**
 * Formats an array of hour timestamps into a readable string
 */
export const formatHours = (hoursArray: string | any[]) => {
  if (!hoursArray || !Array.isArray(hoursArray) || hoursArray.length === 0) {
    return 'All day';
  }
  
  // Sort hours chronologically
  const sortedHours = [...hoursArray].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  // Format each hour
  const formattedHours = sortedHours.map(timestamp => {
    const date = new Date(timestamp);
    return format(date, 'h:mm a');
  });
  
  // If there are more than 2 hours, show only first and count
  if (formattedHours.length > 2) {
    return `${formattedHours[0]}, ${formattedHours[1]} +${formattedHours.length - 2} more`;
  }
  
  return formattedHours.join(', ');
};

/**
 * Counts participants by their status
 */
export const countParticipantsByStatus = (participants: { [s: string]: unknown; } | ArrayLike<unknown>) => {
  if (!participants) return { accepted: 0, pending: 0, total: 0 };
  
  const accepted = Object.values(participants).filter(
    (p: any) => p.status === 'accepted'
  ).length;
  
  const pending = Object.values(participants).filter(
    (p: any) => p.status === 'invited'
  ).length;
  
  return { 
    accepted, 
    pending,
    total: Object.keys(participants).length
  };
};
