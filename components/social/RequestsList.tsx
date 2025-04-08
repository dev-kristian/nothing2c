'use client';

import React from 'react';
import { FriendRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, Check, X, Users, UserX } from 'lucide-react'; 
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RequestsListProps {
  friendRequests: FriendRequest[];
  isLoadingRequests: boolean;
  processingRequests: Set<string>;
  handleAcceptRequest: (request: FriendRequest) => Promise<void>;
  handleRejectRequest: (request: FriendRequest) => Promise<void>;
  getAvatarGradient: (username: string) => string;
  onShowFriends: () => void;
}

export const RequestsList: React.FC<RequestsListProps> = ({
  friendRequests,
  isLoadingRequests,
  processingRequests,
  handleAcceptRequest,
  handleRejectRequest,
  getAvatarGradient,
  onShowFriends,
}) => {
  if (isLoadingRequests) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card/50 border border-accent/10 rounded-2xl p-4 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted"></div>
              <div className="flex-1">
                <div className="h-5 w-1/3 bg-muted rounded"></div>
                <div className="h-4 w-1/4 bg-muted/50 rounded mt-2"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-24 rounded-full bg-muted"></div>
                <div className="h-10 w-24 rounded-full bg-muted"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (friendRequests.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center h-full"
      >
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Bell className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium text-foreground mb-2">No Friend Requests</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          You don&apos;t have any pending friend requests at the moment.
        </p>
        <Button
          onClick={onShowFriends}
          variant="outline"
          className="rounded-full border-pink text-pink hover:bg-pink/10"
        >
          <Users className="h-4 w-4 mr-2" />
          View Friends
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {friendRequests.map((request) => (
        <motion.div
          key={request.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-card/50 border border-accent/10 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {/* Conditional Avatar */}
              {request.exists !== false ? (
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(request.fromUsername)} flex items-center justify-center text-white text-lg font-medium shadow-sm flex-shrink-0`}>
                  {request.fromUsername.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                  <UserX className="h-6 w-6" /> {/* Placeholder Icon */}
                </div>
              )}
              {/* Conditional Username Display */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium",
                  request.exists !== false ? "text-foreground" : "text-muted-foreground italic"
                )}>
                  {request.fromUsername} {/* Will display "unknown user" if exists is false */}
                </p>
                <p className="text-sm text-muted-foreground">
                  Wants to connect with you
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Disable Accept button if user doesn't exist */}
              <Button
                onClick={() => handleAcceptRequest(request)}
                disabled={processingRequests.has(request.id) || request.exists === false}
                className={cn(
                  "rounded-full px-5 py-2 text-white",
                  request.exists !== false ? "bg-pink hover:bg-pink/90" : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                size="sm"
              >
                {processingRequests.has(request.id) && request.exists !== false ? ( // Only show loader if processing and user exists
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </>
                )}
              </Button>

              {/* Reject button remains enabled */}
              <Button
                onClick={() => handleRejectRequest(request)}
                disabled={processingRequests.has(request.id)}
                variant="outline"
                className="rounded-full border-pink text-pink hover:bg-pink/10" // Adjusted text color
                size="sm"
              >
                {processingRequests.has(request.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
