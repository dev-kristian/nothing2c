// src/utils/sessionUtils.ts
import { format } from 'date-fns';

export const formatHours = (hoursArray: string | string[] | 'all') => {
  if (!hoursArray || !Array.isArray(hoursArray) || hoursArray.length === 0) {
    return 'All day';
  }
  
  const sortedHours = [...hoursArray].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  const formattedHours = sortedHours.map(timestamp => {
    const date = new Date(timestamp);
    return format(date, 'h:mm a');
  });
  
  if (formattedHours.length > 2) {
    return `${formattedHours[0]}, ${formattedHours[1]} +${formattedHours.length - 2} more`;
  }
  
  return formattedHours.join(', ');
};

export const countParticipantsByStatus = (participants: { [s: string]: unknown; } | ArrayLike<unknown>) => {
  if (!participants) return { accepted: 0, pending: 0, total: 0 };
  
  const accepted = Object.values(participants).filter(
    (p) => typeof p === 'object' && p !== null && 'status' in p && p.status === 'accepted'
  ).length;
  
  const pending = Object.values(participants).filter(
    (p) => typeof p === 'object' && p !== null && 'status' in p && p.status === 'invited'
  ).length;
  
  return { 
    accepted, 
    pending,
    total: Object.keys(participants).length
  };
};
