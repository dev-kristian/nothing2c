'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, Loader2, UserPlus, UserMinus, Users, 
  Bell, Clock, UserCheck, X, Check, MoreHorizontal,
  ChevronLeft, ArrowRight
} from 'lucide-react';
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
import router from 'next/router';

type ApiError = {
  message: string;
  status?: number;
};

export default function SocialPage() {
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchResultWithStatus[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('friends');
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showSearchPanel && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showSearchPanel]);

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
      setSearchResults(prev => 
        prev.map(user => 
          user.uid === targetUser.uid 
            ? { ...user, requestStatus: { exists: true, type: 'sent' } } 
            : user
        )
      );
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

  const closeSearch = () => {
    setShowSearchPanel(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const getAvatarGradient = (username: string) => {
    const colors = [
      'from-pink-500 to-purple-500',
      'from-pink-500 to-orange-400',
      'from-purple-600 to-blue-500',
      'from-blue-500 to-teal-400',
      'from-teal-500 to-green-400'
    ];
    
    const sum = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  return (
    <div className="min-h-screen">
      <header 
        className={`sticky top-0 z-10 transition-all duration-300 ${
          scrolled ? 'backdrop-blur-xl bg-background/80 shadow-sm' : ''
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="h-16 md:h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h1 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Social
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowSearchPanel(!showSearchPanel)}
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Search for friends"
              >
                <Search className="h-5 w-5 text-muted-foreground" />
              </Button>

              <Button 
                onClick={() => {
                  setShowSearchPanel(true);
                  setTimeout(() => searchInputRef.current?.focus(), 300);
                }}
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Add friend"
              >
                <UserPlus className="h-5 w-5 text-muted-foreground" />
              </Button>
              
              {friendRequests.length > 0 && (
                <div 
                  className="relative cursor-pointer" 
                  onClick={() => setActiveTab('requests')}
                >
                  <Button 
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                    aria-label={`${friendRequests.length} friend requests`}
                  >
                    <Bell className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-pink hover:bg-pink"
                  >
                    {friendRequests.length}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showSearchPanel && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden bg-muted/50 backdrop-blur-lg border-b border-border"
          >
            <div className="container mx-auto px-4 py-6">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for people by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-background/60 focus-visible:ring-pink/30"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-lg h-10 bg-pink hover:bg-pink/90 text-white"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
              
              <div className="flex justify-end mt-4 max-w-2xl mx-auto">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={closeSearch}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
              
              <div className="mt-4 max-w-2xl mx-auto">
                {isSearching ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card/80 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-muted"></div>
                        <div className="flex-1">
                          <div className="h-4 w-1/3 bg-muted rounded"></div>
                          <div className="h-3 w-1/2 bg-muted/50 rounded mt-2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-auto">
                    {searchResults.map((user) => (
                      <div key={user.uid} className="flex items-center justify-between p-3 rounded-xl bg-card/80 backdrop-blur hover:bg-card/90 transition-colors">
                        
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(user.username)} flex items-center justify-center text-white text-lg font-medium shadow-sm`}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.username}</p>
                            {user.email && <p className="text-sm text-muted-foreground truncate max-w-[180px] sm:max-w-xs">{user.email}</p>}
                          </div>
                        </div>
                        
                        {user.requestStatus?.exists ? (
                          <div className="px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-medium flex items-center">
                            {user.requestStatus.type === 'sent' ? (
                              <>
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                Pending
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                                Received
                              </>
                            )}
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleSendFriendRequest(user)}
                            disabled={pendingRequests.has(user.uid)}
                            className="rounded-full px-4 py-2 bg-pink hover:bg-pink/90 text-white text-sm font-medium transition-colors"
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
                ) : searchQuery.trim() && (
                  <div className="text-center py-8 bg-card/80 backdrop-blur rounded-xl">
                    <UserMinus className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="container mx-auto px-4 sm:px-6 py-6">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex justify-center mb-6">
            <TabsList className="bg-muted/50 backdrop-blur p-1 rounded-xl">
              <TabsTrigger 
                value="friends" 
                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Friends
                <Badge className="ml-2 bg-muted text-foreground">
                  {friends.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Bell className="h-4 w-4 mr-2" />
                Requests
                {friendRequests.length > 0 && (
                  <Badge className="ml-2 bg-pink/10 text-pink dark:bg-pink/20">
                    {friendRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="friends" className="focus-visible:outline-none focus-visible:ring-0">
            {isLoadingFriends ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="frosted-panel rounded-2xl p-5 shadow-sm animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted"></div>
                      <div className="flex-1">
                        <div className="h-5 w-1/2 bg-muted rounded"></div>
                        <div className="h-4 w-3/4 bg-muted/50 rounded mt-2"></div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex justify-between">
                      <div className="h-9 w-24 bg-muted rounded-full"></div>
                      <div className="h-9 w-9 bg-muted rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : friends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <motion.div
                    key={friend.uid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="frosted-panel rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarGradient(friend.username)} flex items-center justify-center text-white text-xl font-medium shadow-md`}>
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg truncate text-foreground">{friend.username}</h3>
                        {friend.email && (
                          <p className="text-muted-foreground text-sm truncate">{friend.email}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full px-4 text-foreground hover:bg-muted"
                      >
                        View Profile
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
                        <DropdownMenuItem 
                            onClick={() => handleRemoveFriend(friend)}
                            disabled={removingFriends.has(friend.uid)}
                            className="flex items-center cursor-pointer rounded-lg text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/30"
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
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2">No Friends Yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Search for users and send friend requests to connect with others.
                </p>
                <Button 
                  onClick={() => setShowSearchPanel(true)}
                  className="rounded-full px-6 py-2 bg-pink hover:bg-pink/90 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Find Friends
                </Button>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="focus-visible:outline-none focus-visible:ring-0">
            {isLoadingRequests ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="frosted-panel rounded-2xl p-4 shadow-sm animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted"></div>
                      <div className="flex-1">
                        <div className="h-5 w-1/3 bg-muted rounded"></div>
                        <div className="h-4 w-1/4 bg-muted/50 rounded mt-2"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-10 w-24 rounded-full bg-muted"></div>
                        <div className="h-10 w-24 rounded-full bg-muted"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : friendRequests.length > 0 ? (
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="frosted-panel rounded-2xl p-4 shadow-sm"
                  >
                    
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(request.fromUsername)} flex items-center justify-center text-white text-lg font-medium shadow-sm`}>
                          {request.fromUsername.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{request.fromUsername}</p>
                          <p className="text-sm text-muted-foreground">
                            Wants to connect with you
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          onClick={() => handleAcceptRequest(request)}
                          disabled={processingRequests.has(request.id)}
                          className="rounded-full px-5 py-2 bg-pink hover:bg-pink/90 text-white"
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
                          variant="outline"
                          className="rounded-full border-border"
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
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bell className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2">No Friend Requests</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  You don't have any pending friend requests at the moment.
                </p>
                <Button 
                  onClick={() => setActiveTab('friends')}
                  variant="outline" 
                  className="rounded-full"
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Friends
                </Button>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

