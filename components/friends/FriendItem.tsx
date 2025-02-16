import React from 'react';
import { Button } from '@/components/ui/button';
import { UserRound, Loader2, UserMinus } from 'lucide-react';
import { Friend } from '@/types';

interface FriendItemProps {
  friend: Friend;
  isRemoving: boolean;
  onRemove: (friend: Friend) => void;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, isRemoving, onRemove }) => {
  return (
    <div className="bg-card p-4 rounded-lg flex items-center justify-between hover:bg-card/80 transition-colors">
      <div className="flex items-center gap-3">
        <div className="bg-secondary p-2 rounded-full">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{friend.username}</p>
          {friend.email && <p className="text-sm text-muted-foreground">{friend.email}</p>}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-destructive/20"
        onClick={() => onRemove(friend)}
        disabled={isRemoving}
      >
        {isRemoving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <UserMinus className="h-4 w-4 mr-2" />
        )}
        {isRemoving ? 'Removing...' : 'Remove'}
      </Button>
    </div>
  );
};

export default FriendItem;
