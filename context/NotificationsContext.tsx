// context/NotificationsContext.tsx
'use client';

import React, { createContext, useContext } from 'react';
import { useNotification } from '@/hooks/user/useNotification';
import { NotificationStatus } from '@/types'; // Assuming NotificationStatus is defined in types

// Define the shape of the context data
interface NotificationsContextType {
  updateNotificationStatus: (status: NotificationStatus) => Promise<void>;
}

// Create the context
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Custom hook to consume the context
export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
};

// Provider component
interface NotificationsProviderProps {
  children: React.ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  // Use the existing useNotification hook
  const notificationData = useNotification();

  // Provide the update function from the hook
  return (
    <NotificationsContext.Provider value={notificationData}>
      {children}
    </NotificationsContext.Provider>
  );
};
