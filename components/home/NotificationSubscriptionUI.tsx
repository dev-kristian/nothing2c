

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserData } from '@/types/user';

interface NotificationSubscriptionUIProps {
  isSupported: boolean | null;
  isIOS166OrHigher: boolean;
  isStandalone: boolean;
  userData: UserData | null;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
  handleUpdateNotificationStatus: (status: "allowed" | "denied" | "unsupported") => Promise<void>;
  handleSubscribe: () => Promise<void>;
  handleDismiss: () => void;
}

const NotificationSubscriptionUI: React.FC<NotificationSubscriptionUIProps> = ({
  isSupported,
  isIOS166OrHigher,
  isStandalone,
  userData,
  showDetails,
  setShowDetails,
  handleUpdateNotificationStatus,
  handleSubscribe,
  handleDismiss,
}) => {
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const renderContent = () => {
    if (userData?.notification) {
      return null;
    }

    const dismissButton = (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className="hover:bg-gray-700/50 rounded-full h-8 w-8 flex items-center justify-center"
        aria-label="Dismiss notification"
      >
        <span className="text-gray-400 hover:text-white text-lg">×</span>
      </Button>
    );

    if (isSupported === false) {
      return (
        <motion.div 
          className="bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-lg w-full relative"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="text-yellow-500 mr-2" size={20} />
              <h2 className="text-lg font-semibold text-white">Notifications Not Supported</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-400 hover:text-white"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              {dismissButton}
            </div>
          </div>
          <p className="text-gray-300 text-sm mb-3">Your current device or browser doesn&apos;t support push notifications.</p>
          {showDetails && (
            <div className="text-gray-300 text-sm mb-3">
              <p className="mb-2">To receive notifications, try:</p>
              <ul className="list-disc list-inside">
                <li>Updating your browser to the latest version</li>
                <li>Using a different browser (e.g., Chrome, Firefox)</li>
                <li>Accessing the site from a desktop computer</li>
              </ul>
            </div>
          )}
          <Button 
            onClick={() => handleUpdateNotificationStatus("unsupported")}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black text-sm"
            size="sm"
          >
            Acknowledge
          </Button>
        </motion.div>
      );
    }

    if (isIOS166OrHigher && !isStandalone) {
      return (
        <motion.div 
          className="bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-lg w-full relative"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Info className="text-blue-400 mr-2" size={20} />
              <h2 className="text-lg font-semibold text-white">Enable Notifications</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-400 hover:text-white"
              >
                {showDetails ? 'Hide Steps' : 'Show Steps'}
              </Button>
              {dismissButton}
            </div>
          </div>
          <p className="text-gray-300 text-sm mb-3">Add this page to your home screen to receive notifications.</p>
          {showDetails && (
            <ol className="text-gray-300 text-sm mb-3 list-decimal list-inside">
              <li>Tap the share button <ExternalLink size={14} className="inline" /> at the bottom of your screen</li>
              <li>Scroll down and tap &apos;Add to Home Screen&apos;</li>
              <li>Tap &apos;Add&apos; in the top right corner</li>
              <li>Open the app from your home screen</li>
            </ol>
          )}
        </motion.div>
      );
    }

    if (isSupported && (isStandalone || !isIOS166OrHigher)) {
      return (
        <motion.div 
          className="bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-lg w-full relative "
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="text-pink-500 mr-2" size={20} />
              <h2 className="text-lg font-semibold text-white mr-2">Enable Notifications</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-400 hover:text-white p-2"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              {dismissButton}
            </div>
          </div>
          {showDetails && (
            <p className="text-gray-300 text-sm my-1">Get instant updates on new releases, polls, and exclusive content!</p>
          )}
          <Button 
            onClick={handleSubscribe}
            className="w-full bg-gradient-to-r from-pink-700/50 to-purple-900/70 hover:from-pink-500/50 hover:to-purple-700/70 text-white text-sm transition-all duration-300 mt-2"
            size="sm"
          >
            Subscribe to Notifications
          </Button>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className=" transition-all duration-300 ease-in-out pt-2">
      {renderContent()}
    </div>
  );
};

export default NotificationSubscriptionUI;
