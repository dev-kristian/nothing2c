import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFriends } from '@/hooks/user/useFriends';
import { useSendInvitation } from '@/hooks/useSendInvitation';
import { Friend } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface InviteFriendsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

const InviteFriendsDialog: React.FC<InviteFriendsDialogProps> = ({ isOpen, onClose, sessionId }) => {
  const { friends, isLoadingFriends } = useFriends();
  const { sendInvitation, isLoading: isSendingNotification, error: sendNotificationError } = useSendInvitation();
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [isUpdatingDb, setIsUpdatingDb] = useState(false); 
  const { toast } = useToast();
  const { user } = useAuthContext();

  useEffect(() => {
    if (isOpen) {
      setSelectedFriends([]);
    }
  }, [isOpen, friends]);

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriends((prevSelected) =>
      prevSelected.some((f) => f.uid === friend.uid)
        ? prevSelected.filter((f) => f.uid !== friend.uid)
        : [...prevSelected, friend]
    );
  };

  const handleSendInvites = async () => {
    if (selectedFriends.length === 0) {
      toast({
        variant: "destructive",
        title: "No friends selected",
        description: "Please select at least one friend to invite.",
      });
      return;
    }

    setIsUpdatingDb(true);
    let dbUpdateError: string | null = null;

    try {
      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error("Authentication token not available.");
      }

      const response = await fetch(`/api/sessions/${sessionId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ friendsToInvite: selectedFriends }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Failed to update session participants (status: ${response.status})`);
      }

      try {
        await sendInvitation(selectedFriends, sessionId);
        toast({
          title: "Invitations Sent",
          description: `Successfully invited ${selectedFriends.length} friend(s) and sent notifications.`,
        });
        onClose();
      } catch (notificationErr) {
        console.error("Notification sending failed after DB update:", notificationErr);
        toast({
          variant: "destructive",
          title: "Notification Error",
          description: `Invited ${selectedFriends.length} friend(s), but failed to send notifications. ${sendNotificationError || ''}`,
        });
        onClose();
      }

    } catch (err) {
      dbUpdateError = err instanceof Error ? err.message : "An unexpected error occurred during database update.";
      console.error("Error updating session participants:", err);
      toast({
        variant: "destructive",
        title: "Failed to Invite Friends",
        description: dbUpdateError,
      });
    } finally {
      setIsUpdatingDb(false);
    }
  };

  const renderFriendList = () => {
    if (isLoadingFriends) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-5 w-5 ml-auto" />
            </div>
          ))}
        </div>
      );
    }

    if (!friends || friends.length === 0) {
      if (!isLoadingFriends) {
         return <p className="text-sm text-muted-foreground text-center py-4">You don&apos;t have any friends yet.</p>;
      }
      return null; 
    }

    return friends.map((friend) => (
      <div key={friend.uid} className="flex items-center space-x-4 py-2 px-1 hover:bg-muted/50 rounded-md">
        <Avatar className="h-10 w-10">
          <AvatarImage src={friend.photoURL || undefined} alt={friend.username} />
          <AvatarFallback>{friend.username.substring(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="flex-grow text-sm font-medium">{friend.username}</span>
        <Checkbox
          id={`friend-${friend.uid}`}
          checked={selectedFriends.some((f) => f.uid === friend.uid)}
          onCheckedChange={() => handleSelectFriend(friend)}
          aria-label={`Select ${friend.username}`}
        />
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Friends</DialogTitle>
          <DialogDescription>
            Select friends to invite to this watch session.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4 -mr-4 my-4">
          <div className="space-y-2">
            {renderFriendList()}
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            type="button"
            onClick={handleSendInvites}
            disabled={isUpdatingDb || isSendingNotification || isLoadingFriends || !friends || friends.length === 0 || selectedFriends.length === 0}
          >
            {isUpdatingDb ? 'Updating...' : isSendingNotification ? 'Sending...' : `Send Invites (${selectedFriends.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteFriendsDialog;
