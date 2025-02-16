import React from 'react';
import { Button } from '@/components/ui/button';
import { UserRound, Clock, UserCheck, Loader2, UserPlus } from 'lucide-react';
import { FriendSearchResult, FriendSearchResultWithStatus } from '@/types';

interface FriendSearchResultItemProps {
  user: FriendSearchResultWithStatus;
  isPending: boolean;
  onSendFriendRequest: (targetUser: FriendSearchResult) => void;
}

const SearchResultItem: React.FC<FriendSearchResultItemProps> = ({ user, isPending, onSendFriendRequest }) => {
  return (
    <div className="bg-card p-4 rounded-lg flex items-center justify-between hover:bg-card/80 transition-colors">
      <div className="flex items-center gap-3">
        <div className="bg-secondary p-2 rounded-full">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{user.username}</p>
          {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
        </div>
      </div>
      {user.requestStatus?.exists ? (
        <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
          {user.requestStatus.type === 'sent' ? (
            <>
              <Clock className="h-4 w-4 mr-2" />
              Request Pending
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Request Received
            </>
          )}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-primary/20"
          onClick={() => onSendFriendRequest(user)}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4 mr-2" />
          )}
          {isPending ? 'Sending...' : 'Add Friend'}
        </Button>
      )}
    </div>
  );
};

export default SearchResultItem;
