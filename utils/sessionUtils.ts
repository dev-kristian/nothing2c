// src/utils/sessionUtils.ts
// Removed date-fns import

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
