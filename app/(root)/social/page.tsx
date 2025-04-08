'use client';

import React, { useState, useRef, useEffect } from 'react'; 
import { Users, Bell, Search, ChevronRight, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FriendsList, RequestsList, SearchUsers } from '@/components/social';
import { useUserData } from '@/context/UserDataContext';
import { toast } from "@/hooks/use-toast";
import { Friend, FriendRequest, FriendSearchResult, FriendSearchResultWithStatus } from '@/types';

type ApiError = {
  message: string;
  status?: number;
};

const socialCategories = [
  {
    id: 'friends',
    label: 'Friends',
    icon: Users,
    component: FriendsList,
  },
  {
    id: 'requests',
    label: 'Requests',
    icon: Bell,
    component: RequestsList,
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    component: SearchUsers,
  },
];

export default function SocialPage() {
  const {
    userData,
    friends,
    friendRequests,
    isLoadingFriends,
    isLoadingRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    sendFriendRequest,
  } = useUserData();

  const [activeCategory, setActiveCategory] = useState(socialCategories[0].id);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchResultWithStatus[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false); 

  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [removingFriends, setRemovingFriends] = useState<Set<string>>(new Set());


  const getAvatarGradient = () => {
    return 'from-pink to-pink/80'; 
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !userData?.uid) {
      toast({
        title: 'Search Error',
        description: 'Please enter a username to search',
        variant: 'default',
      });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSearched(true);
    setActiveCategory('search'); 

    try {
      const params = new URLSearchParams();
      params.append('username', searchQuery.trim());
      params.append('currentUserId', userData.uid);

      const response = await fetch(`/api/friends/search?${params.toString()}`);

      if (!response.ok) throw new Error('Failed to search users');

      const data = await response.json();
      const filteredResults = data.users.filter((user: FriendSearchResult) =>
        user.uid !== userData.uid && !friends.some(friend => friend.uid === user.uid)
      );

      setSearchResults(filteredResults);
      if (filteredResults.length === 0) {
        toast({
          title: 'No Results',
          description: 'No users found matching your search criteria.',
          variant: 'default',
        });
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Search error:', error);
      toast({
        title: 'Search Error',
        description: apiError.message || 'Failed to search for users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (targetUser: FriendSearchResult) => {
    if (!userData) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to send friend requests',
        variant: 'destructive',
      });
      return;
    }

    setPendingRequests(prev => new Set(prev).add(targetUser.uid));

    try {
      await sendFriendRequest(targetUser);

      toast({
        title: 'Friend Request Sent',
        description: `Friend request sent to ${targetUser.username}`,
        variant: 'default',
      });
      setSearchResults(prev =>
        prev.map(user =>
          user.uid === targetUser.uid
            ? { ...user, requestStatus: { exists: true, type: 'sent' } }
            : user
        )
      );
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: 'Request Failed',
        description: apiError.message || 'Failed to send friend request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUser.uid);
        return newSet;
      });
    }
  };


   const handleAcceptRequest = async (request: FriendRequest) => {
    setProcessingRequests(prev => new Set(prev).add(request.id));
    try {
      await acceptFriendRequest(request);
      toast({
        title: 'Friend Request Accepted',
        description: `You are now friends with ${request.fromUsername}`,
        variant: 'default',
      });
    } catch (error: unknown) {
       const apiError = error as ApiError;
      toast({
        title: 'Error',
        description: apiError.message || 'Failed to accept friend request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (request: FriendRequest) => {
    setProcessingRequests(prev => new Set(prev).add(request.id));
    try {
      await rejectFriendRequest(request);
      toast({
        title: 'Friend Request Rejected',
        description: `Friend request from ${request.fromUsername} was rejected`,
        variant: 'default',
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: 'Error',
        description: apiError.message || 'Failed to reject friend request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const handleRemoveFriend = async (friend: Friend) => {
    setRemovingFriends(prev => new Set(prev).add(friend.uid));
    try {
      await removeFriend(friend);
      toast({
        title: 'Friend Removed',
        description: `${friend.username} has been removed from your friends list`,
        variant: 'default',
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: 'Error',
        description: apiError.message || 'Failed to remove friend. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRemovingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.uid);
        return newSet;
      });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <div className="container-6xl mx-auto px-2 md:px-4 py-4 md:py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="text-center w-full mb-3 sm:mb-4 md:mb-6"
      >
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-muted-foreground text-xs sm:text-sm font-medium mb-1"
        >
          Connect with friends and discover new ones
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.1,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="font-semibold tracking-tight text-lg sm:text-xl md:text-2xl lg:text-4xl mb-3 sm:mb-4 md:mb-6"
        >
          <span className="text-foreground">Your </span>
          <span className="text-pink font-semibold">Social</span> 
          <span className="text-foreground"> Hub</span>
        </motion.div>
      </motion.div>

      <motion.div
        className="relative w-full max-w-xl mx-auto mb-8" 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.2,
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="w-full">
          <div
            className={`
              frosted-panel p-0 rounded-full shadow-lg overflow-hidden
              transition-all duration-300 ease-out
              ${isInputFocused ? 'ring-1 ring-pink/50 shadow-xl' : ''} {/* Reverted to ring-pink */}
            `}
          >
            <div className="flex items-center p-1 sm:p-1.5 md:p-2">
              <div className="flex-shrink-0 pl-2 sm:pl-3">
                <Search
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors duration-300 ${
                    isInputFocused ? 'text-pink' : 'text-muted-foreground' 
                  }`}
                />
              </div>
              
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Search people..."
                aria-label="Search for people by username"
                className="flex-grow bg-transparent text-foreground placeholder-foreground/50 border-none 
                          py-1.5 sm:py-2 px-1.5 sm:px-2 md:px-3 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-0"
              />
              
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleClearSearch}
                    className="flex-shrink-0 p-1 sm:p-1.5 text-foreground/50 hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
              
              
              <div className="h-5 sm:h-6 w-px bg-foreground/10 mx-0.5 sm:mx-1"></div>
              
              <motion.button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                aria-label="Search"
                className={`
                  flex-shrink-0 bg-pink hover:bg-pink/90 text-white {/* Reverted to bg-pink and text-white */}
                  transition-all duration-300 rounded-2xl py-1 sm:py-1.5 px-2.5 sm:px-3 md:px-4 mx-0.5 sm:mx-1
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center sm:space-x-2">
                  {isSearching ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden sm:inline text-2xs sm:text-xs md:text-sm">Search</span>
                </div>
              </motion.button>
            </div>
          </div>
        </form>
        <div className="mt-2 text-center text-2xs sm:text-xs text-foreground/40 hidden sm:block">
          <span>Press </span>
          <kbd className="px-1 sm:px-1.5 py-0.5 rounded bg-foreground/10 font-mono text-foreground/70">
            ⌘K
          </kbd>
          <span> or </span>
          <kbd className="px-1 sm:px-1.5 py-0.5 rounded bg-foreground/10 font-mono text-foreground/70">
            Ctrl+K
          </kbd>
          <span> to search</span>
        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 space-y-1 flex-shrink-0">
          {socialCategories.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                activeCategory === id
                  ? 'bg-pink text-white' 
                  : 'hover:bg-muted text-foreground' 
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5" />
                <span className="font-medium">{label}</span>
                {id === 'requests' && friendRequests.length > 0 && (
                 <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                    activeCategory === id ? 'bg-white/20 text-white' : 'bg-gray/20 text-muted-foreground'
                   }`}>
                     {friendRequests.length}
                   </span>
                )}
                 {id === 'friends' && (
                   <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                    activeCategory === id ? 'bg-white/20 text-white' : 'bg-gray/20 text-muted-foreground'
                   }`}>
                     {friends.length}
                   </span>
                )}
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                activeCategory === id ? 'rotate-90' : ''
              }`} />
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-[500px] bg-background/50 rounded-lg border border-accent/10 p-6 overflow-hidden">
           {activeCategory === 'friends' && (
             <FriendsList
              friends={friends}
              isLoadingFriends={isLoadingFriends}
              removingFriends={removingFriends}
              handleRemoveFriend={handleRemoveFriend}
               getAvatarGradient={getAvatarGradient}
               onShowSearch={() => setActiveCategory('search')}
             />
           )}
           {activeCategory === 'requests' && (
             <RequestsList
              friendRequests={friendRequests}
              isLoadingRequests={isLoadingRequests}
              processingRequests={processingRequests}
              handleAcceptRequest={handleAcceptRequest}
              handleRejectRequest={handleRejectRequest}
               getAvatarGradient={getAvatarGradient}
               onShowFriends={() => setActiveCategory('friends')}
             />
           )}
           {activeCategory === 'search' && (
             <SearchUsers
               searchResults={searchResults}
               isSearching={isSearching}
               pendingRequests={pendingRequests}
               handleSendFriendRequest={handleSendFriendRequest}
               getAvatarGradient={getAvatarGradient}
               searchQuery={searchQuery} 
               searched={searched} 
             />
           )}
         </div>

      </div>
    </div>
  );
}
