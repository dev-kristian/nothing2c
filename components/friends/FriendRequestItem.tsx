import React from 'react';
import { Button } from '@/components/ui/button';
import { UserRound, Loader2, Check, X } from 'lucide-react';
import { FriendRequest } from '@/types';

interface FriendRequestItemProps {
  request: FriendRequest;
  isProcessing: boolean;
  onAccept: (request: FriendRequest) => void;
  onReject: (request: FriendRequest) => void;
}

const FriendRequestItem: React.FC<FriendRequestItemProps> = ({
  request,
  isProcessing,
  onAccept,
  onReject,
}) => {
  return (
    <div className="bg-card p-4 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-secondary p-2 rounded-full">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{request.fromUsername}</p>
          <p className="text-sm text-muted-foreground">
            Sent {new Date(request.timestamp).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-green-500/20"
          onClick={() => onAccept(request)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          {isProcessing ? 'Accepting...' : 'Accept'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-destructive/20"
          onClick={() => onReject(request)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <X className="h-4 w-4 mr-2" />
          )}
          {isProcessing ? 'Rejecting...' : 'Reject'}
        </Button>
      </div>
    </div>
  );
};

export default FriendRequestItem;
