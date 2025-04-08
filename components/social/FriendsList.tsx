'use client';

import React from 'react';
import { Friend } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, UserMinus, Users, MoreHorizontal } from 'lucide-react'; 
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FriendsListProps {
  friends: Friend[];
  isLoadingFriends: boolean;
  removingFriends: Set<string>;
  handleRemoveFriend: (friend: Friend) => Promise<void>;
  getAvatarGradient: (username: string) => string;
  onShowSearch: () => void;
}

export const FriendsList: React.FC<FriendsListProps> = ({
  friends,
  isLoadingFriends,
  removingFriends,
  handleRemoveFriend,
  getAvatarGradient,
  onShowSearch,
}) => {
  if (isLoadingFriends) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card/50 border border-accent/10 rounded-2xl p-4 shadow-sm animate-pulse">
            <div className="flex items-start gap-4 relative"> 
              <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0"></div>
              <div className="flex-1 pt-1"> 
                <div className="h-5 w-3/4 bg-muted rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-muted/50 rounded"></div>
              </div>
              <div className="absolute top-0 right-0 h-8 w-8 bg-muted rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center h-full"
      >
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium text-foreground mb-2">No Friends Yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Search for users and send friend requests to connect with others.
        </p>
        <Button
          onClick={onShowSearch}
          className="rounded-full px-6 py-2 bg-pink hover:bg-pink/90 text-white" 
        >
          <UserMinus className="h-4 w-4 mr-2" />
          Find Friends
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {friends.map((friend) => (
        <motion.div
          key={friend.uid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative bg-card/50 border border-accent/10 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow" 
        >
          <div className="absolute top-2 right-2 z-10"> 
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted"> 
                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 bg-background border-accent/10">
                <DropdownMenuItem
                  onClick={() => handleRemoveFriend(friend)}
                  disabled={removingFriends.has(friend.uid)}
                  className="flex items-center cursor-pointer rounded-lg text-red-500 focus:text-red-500 focus:bg-red-500/10"
                >
                  {removingFriends.has(friend.uid) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4 mr-2" />
                  )}
                  Remove Friend
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(friend.username)} flex items-center justify-center text-white text-lg font-medium shadow-md flex-shrink-0`}>
              {friend.username.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-medium text-base truncate text-foreground">{friend.username}</h3>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
