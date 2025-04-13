import React, { useEffect, useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { useAuthUser } from '@/context/AuthUserContext'; // Updated import
import { useNotificationsContext } from '@/context/NotificationsContext'; // Updated import
import { requestForToken, onMessageListener } from '@/lib/firebaseMessaging';
import NotificationSubscriptionUI from './NotificationSubscriptionUI';
import { NotificationPayload } from '@/types';
import { NotificationStatus } from '@/types';

const NotificationSubscription = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isIOS166OrHigher, setIsIOS166OrHigher] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { userData } = useAuthUser(); // Get userData from AuthUserContext
  const { updateNotificationStatus } = useNotificationsContext(); // Get function from NotificationsContext
  const [showDetails, setShowDetails] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkSupport = () => {
      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua);

      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

      if (isIOS) {
        const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
        if (match) {
          const version = [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3] || '0', 10)
          ];
          if (version[0] > 16 || (version[0] === 16 && version[1] >= 6)) {
            setIsSupported(true);
            setIsIOS166OrHigher(true);
          } else {
            setIsSupported(false);
          }
        } else {
          setIsSupported(false);
        }
      } else {
        const supported = 'Notification' in window &&
                          'serviceWorker' in navigator &&
                          'PushManager' in window;
        setIsSupported(supported);
      }
    };

    checkSupport();
  }, []);

  useEffect(() => {
    if (isSupported) {
      const setupMessaging = async () => {
        const unsubscribe = await onMessageListener((payload: NotificationPayload) => {
          toast({
            title: payload?.notification?.title || "New Notification",
            description: payload?.notification?.body || "You have a new notification.",
            variant: "default",
          });
        });

        return () => {
          if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribe();
          }
        };
      };

      setupMessaging();
    }
  }, [isSupported]); 

  const handleUpdateNotificationStatus = async (status: NotificationStatus) => {
    try {
      await updateNotificationStatus(status);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update notification status. Please try again.";
      console.error("Error updating notification status:", error);
      toast({
        title: "Error Updating Status",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSubscribe = async () => {
    if (!isSupported) {
      toast({
        title: "Notifications Not Supported",
        description: "Push notifications are not available on this device or browser.",
        variant: "default", 
      });
      await handleUpdateNotificationStatus("unsupported");
      return;
    }

    if ('Notification' in window) {
      const permission = await window.Notification.requestPermission();
      if (permission === "granted") {
        const token = await requestForToken();
        if (token) {
          try {
            await fetch('/api/subscribe-to-topic', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token }),
            });
            await handleUpdateNotificationStatus("allowed");
            toast({
              title: "Notifications Enabled",
              description: "You'll now receive updates from Nothing<sup>2C</sup>!",
              variant: "default",
            });
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to enable notifications. Please try again later.";
            console.error("Error enabling notifications:", error);
            toast({
              title: "Subscription Error",
              description: errorMessage,
              variant: "destructive",
            });
          }
        }
      } else {
        await handleUpdateNotificationStatus("denied");
        toast({
          title: "Permission Denied",
          description: "Please allow notifications in your browser settings to receive updates.",
          variant: "default", 
        });
      }
    } else {
      await handleUpdateNotificationStatus("unsupported");
      toast({
        title: "Notifications Not Supported",
        description: "Your browser doesn't support push notifications.",
        variant: "default",
      });
    }
  };
  
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notificationsDismissed', 'true');
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('notificationsDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  if (isDismissed) {
    return null;
  }

  return (
    <NotificationSubscriptionUI
      isSupported={isSupported}
      isIOS166OrHigher={isIOS166OrHigher}
      isStandalone={isStandalone}
      userData={userData}
      showDetails={showDetails}
      setShowDetails={setShowDetails}
      handleUpdateNotificationStatus={handleUpdateNotificationStatus}
      handleSubscribe={handleSubscribe}
      handleDismiss={handleDismiss}
    />
  );
};

export default NotificationSubscription;
