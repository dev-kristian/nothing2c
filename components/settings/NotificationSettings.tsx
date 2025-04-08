import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff } from 'lucide-react';
import { useUserData } from '@/context/UserDataContext';
import { useNotification } from '@/hooks/user/useNotification';
import { toast } from "@/hooks/use-toast";
import { requestForToken } from '@/lib/firebaseMessaging';
import { getAuth } from 'firebase/auth';
import SpinningLoader from '../SpinningLoader'; 

export default function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false); 
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const { userData, mutateUserData } = useUserData();
  const { updateNotificationStatus } = useNotification();

  useEffect(() => {
    const checkSupport = () => {
      const supported = 'Notification' in window &&
                       'serviceWorker' in navigator &&
                       'PushManager' in window;
      setIsSupported(supported);
    };
    checkSupport();
  }, []);

  const handleToggleNotifications = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      if (!isSupported) {
        toast({
          title: "Not Supported",
          description: "Push notifications are not supported in your browser.",
          variant: "destructive",
        });
        return;
      }

      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to manage notifications.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (enabled) {
        const permission = await window.Notification.requestPermission();
        if (permission === "granted") {
          const token = await requestForToken();
          if (token) {
            try {
              const response = await fetch('/api/subscribe-to-topic', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  token,
                  topic: `user_${user.uid}`
                }),
              });
              
              const data = await response.json();
              if (!data.success) {
                throw new Error(data.error || 'Failed to subscribe to notifications');
              }
      
              setIsUpdatingStatus(true);
              try {
                await updateNotificationStatus("allowed");
                mutateUserData(); 
              } finally {
                setIsUpdatingStatus(false);
              }
              toast({
                title: "Notifications Enabled",
                description: "You'll now receive updates from Nothing<sup>2C</sup>!",
                variant: "default", 
              });
            } catch (error) {
              console.error("Error enabling notifications:", error);
              toast({
                title: "Error",
                description: "Failed to enable notifications. Please try again.",
                variant: "destructive",
              });
            }
          }
        } else {
          setIsUpdatingStatus(true);
          try {
            await updateNotificationStatus("denied");
            mutateUserData();
          } finally {
            setIsUpdatingStatus(false);
          }
          toast({
            title: "Permission Denied",
            description: "Please allow notifications in your browser settings.",
            variant: "default",
          });
        }
      } else {
        try {
          const token = await requestForToken();
          if (token) {
            const response = await fetch('/api/unsubscribe-from-topic', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                token,
                topic: `user_${user.uid}`
              }),
            });
            
            const data = await response.json();
            if (!data.success) {
              console.error("Error unsubscribing:", data.error);
            }
          }
        } catch (error) {
          console.error("Error unsubscribing from notifications:", error);
        }

        setIsUpdatingStatus(true);
        try {
          await updateNotificationStatus("denied");
          mutateUserData();
        } finally {
          setIsUpdatingStatus(false);
        }
        toast({
          title: "Notifications Disabled",
          description: "You won't receive any notifications from Nothing <sup>2C</sup>.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating notification settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationStatus = () => {
    if (!isSupported) {
      return "Browser doesn't support notifications";
    }
    if (userData?.notification === "allowed") {
      return "Notifications are enabled";
    }
    return "Notifications are disabled";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Notification Settings</h2>
      
      <div className="bg-background/50 border border-pink/10 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {userData?.notification === "allowed" ? (
                <Bell className="h-5 w-5 text-pink" />
              ) : (
                <BellOff className="h-5 w-5 text-foreground/70" />
              )}
              <h3 className="font-medium">Push Notifications</h3>
            </div>
            <p className="text-sm text-foreground/70">
              {getNotificationStatus()}
            </p>
            <p className="text-sm text-foreground/70">
              Receive notifications about new movie nights, friend requests, and updates
            </p>
          </div>
          {isUpdatingStatus ? (
            <div className="flex items-center justify-center h-6 w-10">
              <SpinningLoader size={20} />
            </div>
          ) : (
            <Switch
              checked={userData?.notification === "allowed"}
              onCheckedChange={handleToggleNotifications}
              disabled={isLoading || !isSupported} 
              className="data-[state=checked]:bg-pink"
            />
          )}
        </div>

        {!isSupported && (
          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <p className="text-sm text-yellow-500">
              Push notifications are not supported in your current browser. 
              Try using a modern browser like Chrome or Firefox.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
