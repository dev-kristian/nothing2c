'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, UserPlus, UserRound, UserMinus, Users, Bell, Clock, UserCheck, X, Check, MoreHorizontal } from 'lucide-react';
import { useCustomToast } from '@/hooks/useToast';
import { useUserData } from '@/context/UserDataContext';
import { Friend, FriendRequest, FriendSearchResult, FriendSearchResultWithStatus } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Custom error type
type ApiError = {
  message: string;
  status?: number;
};

export default function FriendsPage() {
  const {
    userData,
    friends,
    friendRequests,
    isLoadingFriends,
    isLoadingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  } = useUserData();
  const { showToast } = useCustomToast();

  // Search state & handlers
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchResultWithStatus[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('friends');
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !userData?.uid) {
      showToast('Search Error', 'Please enter a username to search', 'info');
      return;
    }
    setIsSearching(true);
    setSearchResults([]);
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
        showToast('No Results', 'No users found with that username', 'default');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Search error:', error);
      showToast('Search Error', apiError.message || 'Failed to search for users. Please try again.', 'warning');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (targetUser: FriendSearchResult) => {
    if (!userData) {
      showToast('Authentication Error', 'You must be logged in to send friend requests', 'warning');
      return;
    }
    setPendingRequests(prev => new Set(prev).add(targetUser.uid));
    try {
      await sendFriendRequest(targetUser);
      showToast('Friend Request Sent', `Friend request sent to ${targetUser.username}`, 'success');
      setSearchResults([]);
      setSearchQuery('');
      setShowSearchPanel(false);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showToast('Request Failed', apiError.message || 'Failed to send friend request. Please try again.', 'error');
    } finally {
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUser.uid);
        return newSet;
      });
    }
  };

  // Friend request processing state & handlers
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  
  const handleAcceptRequest = async (request: FriendRequest) => {
    setProcessingRequests(prev => new Set(prev).add(request.id));
    try {
      await acceptFriendRequest(request);
      showToast('Friend Request Accepted', `You are now friends with ${request.fromUsername}`, 'success');
      setActiveTab('friends');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showToast('Error', apiError.message || 'Failed to accept friend request. Please try again.', 'error');
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
      showToast('Friend Request Rejected', `Friend request from ${request.fromUsername} was rejected`, 'info');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showToast('Error', apiError.message || 'Failed to reject friend request. Please try again.', 'error');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  // Friend removal state & handler
  const [removingFriends, setRemovingFriends] = useState<Set<string>>(new Set());
  
  const handleRemoveFriend = async (friend: Friend) => {
    setRemovingFriends(prev => new Set(prev).add(friend.uid));
    try {
      await removeFriend(friend);
      showToast('Friend Removed', `${friend.username} has been removed from your friends list`, 'success');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      showToast('Error', apiError.message || 'Failed to remove friend. Please try again.', 'error');
    } finally {
      setRemovingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.uid);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen  transition-colors duration-300">
      {/* Top Navigation Bar - Apple Style */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 dark:bg-black/70 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className=" frosted-panel mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            People
          </h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSearchPanel(!showSearchPanel)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <button 
              onClick={() => {
                setShowSearchPanel(true);
                setTimeout(() => document.querySelector('input')?.focus(), 300);
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <UserPlus className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Search Panel - Slides down when active */}
      <AnimatePresence>
        {showSearchPanel && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50"
          >
            <div className="container mx-auto px-6 py-4">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for people by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-gray-100/70 dark:bg-gray-800/70 border-none focus-visible:ring-2 focus-visible:ring-pink-500/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-lg h-10 bg-pink-500 hover:bg-pink-600 text-white"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>
              
              {/* Search Results */}
              <div className="mt-4 max-w-2xl mx-auto">
                {isSearching ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        <div className="flex-1">
                          <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-700/50 rounded mt-2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-auto">
                    {searchResults.map((user) => (
                      <div key={user.uid} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-lg font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
                            {user.email && <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>}
                          </div>
                        </div>
                        
                        {user.requestStatus?.exists ? (
                          <div className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium flex items-center">
                            {user.requestStatus.type === 'sent' ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                                Pending
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                                Received
                              </>
                            )}
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleSendFriendRequest(user)}
                            disabled={pendingRequests.has(user.uid)}
                            className="rounded-full px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium transition-colors"
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
                ) : searchQuery && (
                  <div className="text-center py-8">
                    <UserRound className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">No users found matching &quot;{searchQuery}&quot;</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
        
      </AnimatePresence>
      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <Tabs 
          defaultValue="friends" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex justify-center mb-6">
            <TabsList className="bg-gray-100/70 dark:bg-gray-800/70 p-1 rounded-xl">
              <TabsTrigger 
                value="friends" 
                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Friends
                <Badge className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {friends.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
              >
                <Bell className="h-4 w-4 mr-2" />
                Requests
                {friendRequests.length > 0 && (
                  <Badge className="ml-2 bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300">
                    {friendRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Friends Tab */}
          <TabsContent value="friends" className="focus-visible:outline-none focus-visible:ring-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoadingFriends ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1">
                        <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-700/50 rounded mt-2"></div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                      <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                  </div>
                ))
              ) : friends.length > 0 ? (
                friends.map((friend) => (
                  <div key={friend.uid} className="frosted-panel rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xl font-medium">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg truncate text-gray-900 dark:text-gray-100">{friend.username}</h3>
                        {friend.email && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{friend.email}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                            <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
                          <DropdownMenuItem 
                            onClick={() => handleRemoveFriend(friend)}
                            disabled={removingFriends.has(friend.uid)}
                            className="flex items-center cursor-pointer rounded-lg text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/50"
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
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">No Friends Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                    Search for users and send friend requests to connect with others.
                  </p>
                  <Button 
                    onClick={() => setShowSearchPanel(true)}
                    className="rounded-full px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Find Friends
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="focus-visible:outline-none focus-visible:ring-0">
            {isLoadingRequests ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1">
                        <div className="h-5 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-1/4 bg-gray-100 dark:bg-gray-700/50 rounded mt-2"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-10 w-24 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                        <div className="h-10 w-24 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : friendRequests.length > 0 ? (
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <div key={request.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-lg font-medium">
                          {request.fromUsername.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{request.fromUsername}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptRequest(request)}
                          disabled={processingRequests.has(request.id)}
                          className="rounded-full px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium transition-colors"
                        >
                          {processingRequests.has(request.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Accept
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => handleRejectRequest(request)}
                          disabled={processingRequests.has(request.id)}
                          className="rounded-full px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Bell className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">No Friend Requests</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                  When someone sends you a friend request, it will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
