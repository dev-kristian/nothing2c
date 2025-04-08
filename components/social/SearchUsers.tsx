'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserMinus, Clock, UserCheck } from 'lucide-react'; 
import { FriendSearchResult, FriendSearchResultWithStatus } from '@/types';

interface SearchUsersProps {
  searchResults: FriendSearchResultWithStatus[];
  isSearching: boolean;
  pendingRequests: Set<string>;
  handleSendFriendRequest: (targetUser: FriendSearchResult) => Promise<void>;
  getAvatarGradient: (username: string) => string;
  searchQuery: string;
  searched: boolean;
}

export const SearchUsers: React.FC<SearchUsersProps> = ({
  searchResults,
  isSearching,
  pendingRequests,
  handleSendFriendRequest,
  getAvatarGradient,
  searchQuery,
  searched,
}) => {
  return (
    <div className="space-y-6">
      <div className="mt-0">
        {isSearching ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-accent/10 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-muted"></div>
                <div className="flex-1">
                  <div className="h-4 w-1/3 bg-muted rounded"></div>
                  <div className="h-3 w-1/2 bg-muted/50 rounded mt-2"></div>
                </div>
                <div className="h-9 w-28 bg-muted rounded-full"></div>
              </div>
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {searchResults.map((user) => (
              <div key={user.uid} className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-accent/10 hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(user.username)} flex items-center justify-center text-white text-lg font-medium shadow-sm flex-shrink-0`}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{user.username}</p>
                  </div>
                </div>

                {user.requestStatus?.exists ? (
                  <div className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium flex items-center flex-shrink-0">
                    {user.requestStatus.type === 'sent' ? (
                      <>
                        <Clock className="h-3 w-3 mr-1.5 text-muted-foreground" />
                        Pending
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3 w-3 mr-1.5 text-muted-foreground" />
                        Received
                      </>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => handleSendFriendRequest(user)}
                    disabled={pendingRequests.has(user.uid)}
                    className="rounded-full px-4 py-2 bg-pink hover:bg-pink/90 text-white text-sm font-medium transition-colors flex-shrink-0"
                    size="sm"
                  >
                    {pendingRequests.has(user.uid) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : searched && ( 
          <div className="text-center py-12 bg-card/50 border border-accent/10 rounded-xl">
            <UserMinus className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No users found matching &quot;{searchQuery}&quot;</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try searching for a different username.</p>
          </div>
        )}
      </div>
    </div>
  );
};
