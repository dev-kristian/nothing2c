// components/Navigation.tsx
'use client'

import Link from 'next/link';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useFriends } from '@/hooks/user/useFriends';
import { useSessionSubscription } from '@/hooks/session/useSessionSubscription';
import {
  Menu,
  TvMinimalPlay,
  Share2,
  Library,
  LogIn,
  LucideIcon,
  Compass // Added Compass icon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

// Import refactored components
import NotificationDropdown from './navigation/NotificationDropdown';
import UserProfileDropdown from './navigation/UserProfileDropdown';
import DesktopNavLinks from './navigation/DesktopNavLinks';
import MobileSidebar from './navigation/MobileSidebar';
import { ThemeToggle } from './navigation/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut, isServerSessionPending, loading } = useAuthContext();
  const { friendRequests } = useFriends();
  const { sessions } = useSessionSubscription();
  const router = useRouter();
  const pathname = usePathname();

  const pendingFriendRequestsCount = friendRequests.length;
  const pendingInvitationsCount = useMemo(() => {
    // Use user directly
    if (!user?.uid || !sessions) return 0;
    return sessions.filter(session => session.participants?.[user.uid]?.status === 'invited').length;
  }, [sessions, user?.uid]);
  const totalNotifications = pendingFriendRequestsCount + pendingInvitationsCount;

  const navigationItems = useMemo((): NavItem[] => {
    const baseItems: NavItem[] = [];
    if (user && user.emailVerified && !isServerSessionPending) {
      return [
        ...baseItems,
        { href: '/', icon: Compass, label: 'Discover' },
        { href: '/watch-together', icon: TvMinimalPlay, label: 'Watch Together' },
        { href: '/my-library', icon: Library, label: 'My Library' },
        { href: '/social', icon: Share2, label: 'Social' },
      ];
    }
    return baseItems;
  }, [user, isServerSessionPending]);

  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setIsOpen(false);

    try {
      const success = await signOut();

      if (success) {
        router.push('/');
      } else {
         toast({
           title: "Sign Out Failed",
           description: "An unknown error occurred during sign out.",
           variant: "destructive",
         });
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      toast({
        title: "Sign Out Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, signOut, router]); 

  const isActivePath = (path: string) => pathname === path;

  if (loading) {
    return (
      <nav className="fixed w-full z-50 py-1 h-[var(--navbar-height)] bg-background/60 dark:bg-background/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex flex-col space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-20" />
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <div className="flex items-center md:hidden space-x-2">
               <Skeleton className="h-9 w-9 rounded-full" />
               <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Removed intermediate isAuthenticated variable, check directly where needed

  return (
    <>
    {!isOpen && (
      <nav
      className={`fixed w-full z-50 py-1 h-[var(--navbar-height)] transition-all duration-500 ${
        scrolled
          ? 'bg-background/60 dark:bg-background/30 backdrop-blur-xl shadow-lg'
          : 'bg-background/60 dark:bg-background/30 backdrop-blur-xl '
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16 relative nav-container">
          <Link href="/" className="group flex items-center space-x-3" aria-label="Nothing2C Home">
            <div className="relative">
              <motion.div
                whileHover={{
                  scale: 1.12,
                  rotate: [0, -8, 12, -3, 0],
                  transition: { duration: 0.4 }
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 450, damping: 15 }}
                className="relative z-10"
              >
                <img
                  src="/icons/popcorn.png"
                  alt=""
                  width={46}
                  height={46}
                  className="drop-shadow-lg filter"
                />
              </motion.div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-xl font-bold tracking-tight relative">
                  <span className="text-pink">Nothing</span>
                  <sup className="absolute -right-5 text-xs font-bold text-pink">2C</sup>
                </span>
              </div>
              <span className="text-[10px] text-pin-secondary dark:text-label-secondary-dark font-medium tracking-widest uppercase -mt-0.5 ml-0.5">
                Entertainment
              </span>
            </div>
          </Link>
          <div className="hidden md:flex items-center space-x-2">
            <DesktopNavLinks navigationItems={navigationItems} isActivePath={isActivePath} />
            {/* Restore original check: user exists, email verified, AND server session is NOT pending */}
            {user && user.emailVerified && !isServerSessionPending ? (
              <>
                <NotificationDropdown
                  user={user}
                  friendRequests={friendRequests}
                  sessions={sessions}
                  totalNotifications={totalNotifications}
                />
                <UserProfileDropdown
                  user={user}
                  onSignOut={handleSignOut}
                  isSigningOut={isSigningOut}
                />
              </>
            ) : (
              <>
                <ThemeToggle /> 
                <Button 
                  asChild 
                  className="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 font-medium bg-pink text-white hover:bg-pink/90" // Apply active styles + subtle hover
                >
                  <Link href="/sign-in">
                    <LogIn className="h-4 w-4 text-white" />
                    <span>Sign In</span>
                  </Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center md:hidden space-x-2">
            {/* Restore original check: user exists, email verified, AND server session is NOT pending */}
            {user && user.emailVerified && !isServerSessionPending ? (
              <>
                <NotificationDropdown
                  user={user}
                  friendRequests={friendRequests}
                  sessions={sessions}
                  totalNotifications={totalNotifications}
                  className="mr-0"
                  onItemClick={() => setIsOpen(false)}
                />
                {!isOpen && (
                  <motion.button
                    className="p-2 rounded-full  transition-colors duration-300"
                    onClick={() => setIsOpen(true)}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Open menu"
                  >
                    <Menu className="h-6 w-6" />
                  </motion.button>
                )}
              </>
            ) : (
              <>
                <ThemeToggle />
                <Button 
                  asChild 
                  className="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 font-medium bg-pink text-white hover:bg-pink/90" // Apply active styles + subtle hover
                >
                  <Link href="/sign-in">
                    <LogIn className="h-4 w-4 text-white" />
                    <span>Sign In</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
    )}

    <MobileSidebar
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      navigationItems={navigationItems}
      isActivePath={isActivePath}
      user={user}
      onSignOut={handleSignOut}
      isSigningOut={isSigningOut}
    />
    </>
  );
}
