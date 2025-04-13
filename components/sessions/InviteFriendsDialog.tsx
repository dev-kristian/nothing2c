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
import { Search, UserPlus } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { user } = useAuthContext();

  useEffect(() => {
    if (isOpen) {
      setSelectedFriends([]);
      setSearchQuery('');
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
          description: `Successfully invited ${selectedFriends.length} friend(s) to join.`,
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

  const filteredFriends = friends?.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const renderFriendList = () => {
    if (isLoadingFriends) {
      return (
        <div className="space-y-4 px-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-5 ml-auto" />
            </div>
          ))}
        </div>
      );
    }

    if (!friends || friends.length === 0) {
      if (!isLoadingFriends) {
        return (
          <div className="flex flex-col items-center justify-center py-6 md:py-8 text-center space-y-3 md:space-y-4">
            <UserPlus className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">No friends found</p>
          </div>
        );
      }
      return null;
    }

    if (filteredFriends.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-6 md:py-8">
          No friends match your search criteria.
        </p>
      );
    }

    return filteredFriends.map((friend) => (
      <div 
        key={friend.uid} 
        className="flex items-center space-x-3 md:space-x-4 py-2 md:py-3 px-2 md:px-3 hover:bg-muted/40 rounded-lg transition-colors duration-200"
      >
        <div 
          className="flex items-center space-x-3 md:space-x-4 flex-grow cursor-pointer"
          onClick={() => handleSelectFriend(friend)}
        >
          <Avatar className="h-8 w-8 md:h-10 md:w-10 ring-2 ring-background shadow-sm">
            <AvatarImage src={friend.photoURL || undefined} alt={friend.username} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {friend.username.substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-medium truncate">{friend.username}</p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            id={`friend-${friend.uid}`}
            checked={selectedFriends.some((f) => f.uid === friend.uid)}
            onCheckedChange={() => handleSelectFriend(friend)}
            aria-label={`Select ${friend.username}`}
            className="h-5 w-5 rounded-md data-[state=checked]:bg-pink data-[state=checked]:text-primary-foreground"
          />
        </div>
      </div>
    ));
  };

  const isButtonDisabled = isUpdatingDb || isSendingNotification || isLoadingFriends || 
    !friends || friends.length === 0 || selectedFriends.length === 0;
    
  const mobileRowHeight = 56; 
  const desktopRowHeight = 66; 

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-md rounded-xl shadow-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4 border-b">
          <DialogTitle className="text-lg sm:text-xl font-semibold">Invite Friends</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm opacity-70 pt-1">
            Select friends to invite to this watch session.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-4 sm:px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-muted/30 focus:outline-none focus:ring-1 focus:ring-pink focus:border-pink transition-all"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Mobile: 3 friends height, Desktop: 5 friends height */}
        <ScrollArea 
          className={`
            px-4 sm:px-6 py-2 overflow-y-auto
            ${filteredFriends.length <= 3 ? 'max-h-full sm:max-h-full' : `h-${mobileRowHeight * 3} sm:h-${desktopRowHeight * 5}`}
          `}
          style={{ 
            height: filteredFriends.length <= 3 ? 'auto' : `${mobileRowHeight * 3}px`,
            // Override height for desktop screens
            ['--height-desktop' as any]: filteredFriends.length <= 5 ? 'auto' : `${desktopRowHeight * 5}px`
          }}
        >
          <div className="space-y-1">
            {renderFriendList()}
          </div>
        </ScrollArea>

        {selectedFriends.length > 0 && (
          <div className="px-4 sm:px-6 py-2 sm:py-3 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {selectedFriends.length} {selectedFriends.length === 1 ? 'friend' : 'friends'} selected
            </p>
          </div>
        )}

        <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t flex flex-row justify-end space-x-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="rounded-lg h-9 sm:h-10">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            type="button"
            onClick={handleSendInvites}
            disabled={isButtonDisabled}
            className={`rounded-lg h-9 sm:h-10 font-medium ${isButtonDisabled ? 'opacity-50' : 'shadow-sm hover:shadow-md transition-shadow'}`}
          >
            {isUpdatingDb || isSendingNotification ? 'Sending...' : 'Send Invites'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteFriendsDialog;