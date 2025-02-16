import React, { useEffect, useState } from 'react';
import { useCustomToast } from '@/hooks/useToast';
import { useUserData } from '@/context/UserDataContext';
import { requestForToken, onMessageListener } from '@/lib/firebaseMessaging';
import NotificationSubscriptionUI from './NotificationSubscriptionUI';
import { NotificationPayload } from '@/types';
import { NotificationStatus } from '@/types';

const NotificationSubscription = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isIOS166OrHigher, setIsIOS166OrHigher] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { showToast } = useCustomToast();
  const { userData, updateNotificationStatus } = useUserData();
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
          console.log('New foreground notification:', payload);
          showToast(
            payload?.notification?.title || "New Notification",
            payload?.notification?.body || "You have a new notification.",
            "default",
          );
        });

        return () => {
          if (unsubscribe && typeof unsubscribe === 'function') {
            unsubscribe();
          }
        };
      };

      setupMessaging();
    }
  }, [isSupported, showToast]);

  const handleUpdateNotificationStatus = async (status: NotificationStatus) => {
    try {
      await updateNotificationStatus(status);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update notification status. Please try again.";
      console.error("Error updating notification status:", error);
      showToast(
        "Error Updating Status",
        errorMessage,
        "error",
      );
    }
  };

  const handleSubscribe = async () => {
    if (!isSupported) {
      showToast(
        "Notifications Not Supported",
        "Push notifications are not available on this device or browser.",
        "warning",
      );
      await handleUpdateNotificationStatus("unsupported");
      return;
    }

    if ('Notification' in window) {
      const permission = await window.Notification.requestPermission();
      if (permission === "granted") {
        console.log("Notification permission granted. Requesting for token.");
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
            showToast(
              "Notifications Enabled",
              "You'll now receive updates from Kino & Cill!",
              "default",
            );
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to enable notifications. Please try again later.";
            console.error("Error enabling notifications:", error);
            showToast(
              "Subscription Error",
              errorMessage,
              "error",
            );
          }
        }
      } else {
        await handleUpdateNotificationStatus("denied");
        showToast(
          "Permission Denied",
          "Please allow notifications in your browser settings to receive updates.",
          "warning",
        );
      }
    } else {
      await handleUpdateNotificationStatus("unsupported");
      showToast(
        "Notifications Not Supported",
        "Your browser doesn't support push notifications.",
        "warning",
      );
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
