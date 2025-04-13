'use client'

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import { Bell, Share2, TvMinimalPlay, User as UserIcon } from 'lucide-react';
import { motion} from 'framer-motion';
import { FriendRequest, Session } from '@/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface NotificationDropdownProps {
  user: User | null;
  friendRequests: FriendRequest[];
  sessions: Session[];
  totalNotifications: number;
  className?: string;
  onOpenChange?: (open: boolean) => void;
  onItemClick?: () => void;
}

export default function NotificationDropdown({
  user,
  friendRequests,
  sessions,
  totalNotifications,
  className = '',
  onOpenChange,
  onItemClick,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const pendingFriendRequestsCount = friendRequests.length;
  const pendingInvitationsCount = sessions.filter(
    session => user && session.participants?.[user.uid]?.status === 'invited' // Added user && check
  ).length;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  const handleItemClick = (path: string) => {
    router.push(path);
    setIsOpen(false);
    if (onItemClick) {
      onItemClick();
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <motion.div
          className={cn("relative focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0", className)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant='ghost'
            size="icon"
            className="rounded-full border border-transparent bg-transparent text-foreground hover:bg-transparent hover:text-pink hover:border-pink focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          {totalNotifications > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-pink hover:bg-pink text-white"
            >
              {totalNotifications}
            </Badge>
          )}
        </motion.div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-screen max-w-sm px-4 md:w-80 md:max-w-none md:px-0 backdrop-blur-xl bg-background/80 border border-border shadow-lg dark:shadow-none rounded-xl overflow-hidden"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-base font-medium py-1 px-0 md:px-2 border-b border-border">
          Notifications
        </DropdownMenuLabel>

        {totalNotifications === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="p-3 rounded-full bg-muted mb-3">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No new notifications
            </p>
          </div>
        ) : (
          <div className="max-h-48 md:max-h-64 overflow-y-auto">
            {pendingFriendRequestsCount > 0 && (
              <div className="py-1 px-0 md:px-0">
                <DropdownMenuLabel className="px-4 pt-2 pb-1 text-xs text-muted-foreground uppercase tracking-wider flex items-center">
                  <Share2 className="h-3.5 w-3.5 mr-1.5" /> Friend Requests
                </DropdownMenuLabel>
                {friendRequests.map((request, index) => (
                  <DropdownMenuItem
                    key={`fr-${request.id}`}
                    className="p-0 focus:bg-transparent cursor-default"
                  >
                    <div
                      className={cn(
                        "group w-full px-0 md:px-4 py-2 cursor-pointer transition-colors duration-150",
                        index % 2 !== 0 ? 'bg-secondary' : '', 
                        'hover:bg-pink' 
                      )}
                      onClick={() => handleItemClick('/social?tab=requests')}
                    >
                      <div className="flex items-center space-x-2">
                        {request.fromPhotoURL ? (
                          <Image
                            src={request.fromPhotoURL}
                            alt={`${request.fromUsername}'s avatar`}
                            width={28}
                            height={28}
                            className="rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-grow min-w-0"> 
                          <p className="text-sm font-medium transition-colors duration-150 truncate group-hover:text-primary-foreground">
                            Request from <span className="text-pink group-hover:text-primary-foreground">{request.fromUsername}</span> {/* Username hover */}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate group-hover:text-primary-foreground/80 transition-colors duration-150">
                            {new Date(request.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}

            {pendingInvitationsCount > 0 && (
              <div className="py-1 px-0 md:px-0">
                 <DropdownMenuLabel className="px-0 md:px-4 pt-2 pb-1 text-xs text-muted-foreground uppercase tracking-wider flex items-center">
                   <TvMinimalPlay className="h-3.5 w-3.5 mr-1.5" /> Session Invites
                 </DropdownMenuLabel>
                {sessions
                  .filter(session => user && session.participants?.[user.uid]?.status === 'invited') // Added user && check
                  .map((session, index) => {
                    const participantIds = Object.keys(session.participants || {});
                    const otherInviteesCount = participantIds.filter(uid => uid !== user?.uid && uid !== session.createdByUid).length; // Note: user?.uid here is okay as it's a different context
                    const movieTitles = session.poll?.movieTitles;

                    let secondaryText = '';
                    if (movieTitles && movieTitles.length > 0) {
                      secondaryText = ` for '${movieTitles[0]}'`;
                      if (movieTitles.length > 1) {
                        secondaryText += ' & more';
                      }
                    } else { 
                      if (otherInviteesCount === 1) {
                         secondaryText = ` with 1 other to a Watch Party`;
                      } else if (otherInviteesCount > 1) {
                         secondaryText = ` with ${otherInviteesCount} others to a Watch Party`;
                      } else {
                         secondaryText = ` to a Watch Party`;
                      }
                    }

                    return (
                    <DropdownMenuItem
                      key={`si-${session.id}`}
                      className="p-0 focus:bg-transparent cursor-default"
                    >
                      <div
                      className={cn(
                        "group w-full px-0 md:px-4 py-2 cursor-pointer transition-colors duration-150",
                        index % 2 !== 0 ? 'bg-secondary' : '',
                        'hover:bg-pink' 
                      )}
                      onClick={() => handleItemClick(`/watch-together/${session.id}`)}
                    >
                       <div className="flex-grow min-w-0">
                          <p className="text-sm font-medium transition-colors duration-150 truncate group-hover:text-primary-foreground">
                            Invite from <span className="text-pink group-hover:text-primary-foreground">{session.createdBy}</span> {/* Username hover */}
                            {secondaryText && (
                              <span className="text-muted-foreground group-hover:text-primary-foreground/80 transition-colors duration-150">{secondaryText}</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate group-hover:text-primary-foreground/80 transition-colors duration-150">
                               {new Date(session.createdAtEpoch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )} 
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
