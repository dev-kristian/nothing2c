// components/Navigation.tsx
'use client'

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useFriends } from '@/hooks/user/useFriends';
import { useSessionSubscription } from '@/hooks/session/useSessionSubscription';
import {
  Menu,
  DraftingCompass,
  TvMinimalPlay,
  Share2,
  Library
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

// Import refactored components
import NotificationDropdown from './navigation/NotificationDropdown';
import UserProfileDropdown from './navigation/UserProfileDropdown';
import DesktopNavLinks from './navigation/DesktopNavLinks';
import MobileSidebar from './navigation/MobileSidebar';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false); // Mobile sidebar state
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuthContext();
  const [displayUser, setDisplayUser] = useState<User | null>(user); // Keep local state for smoother sign-out transition
  const { friendRequests } = useFriends();
  const { sessions } = useSessionSubscription();
  const router = useRouter();
  const pathname = usePathname();

  const pendingFriendRequestsCount = friendRequests.length;
  const pendingInvitationsCount = useMemo(() => {
    if (!displayUser?.uid || !sessions) return 0;
    return sessions.filter(session => session.participants?.[displayUser.uid]?.status === 'invited').length;
  }, [sessions, displayUser?.uid]); 
  const totalNotifications = pendingFriendRequestsCount + pendingInvitationsCount;

  const navigationItems = useMemo(() => [
    { href: '/discover', icon: DraftingCompass, label: 'Discover' },
    { href: '/watch-together', icon: TvMinimalPlay, label: 'Watch Together' },
    { href: '/my-library', icon: Library, label: 'My Library' },
    { href: '/social', icon: Share2, label: 'Social' },
  ], []);

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
    setIsOpen(false); // Close mobile sidebar on navigation
  }, [pathname]);

  useEffect(() => {
    if (!isSigningOut) {
      setDisplayUser(user);
    }
  }, [user, isSigningOut]);

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setIsOpen(false); // Close mobile sidebar if open

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

  return (
    <>
    {!isOpen && (
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
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
                <Image
                  src="/icons/popcorn.png"
                  alt=""
                  width={46}
                  height={46}
                  className="drop-shadow-lg filter"
                  priority
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
          {/* Desktop Navigation Area */}
          <div className="hidden md:flex items-center space-x-4">
            <DesktopNavLinks navigationItems={navigationItems} isActivePath={isActivePath} />
            <NotificationDropdown
              user={displayUser}
              friendRequests={friendRequests}
              sessions={sessions}
              totalNotifications={totalNotifications}
            />
            <UserProfileDropdown
              user={displayUser}
              onSignOut={handleSignOut}
              isSigningOut={isSigningOut}
            />
          </div>

          {/* Mobile Navigation Area */}
          <div className="flex items-center md:hidden">
            {/* Mobile Notification Bell (Placed before Menu) */}
            <NotificationDropdown
              user={displayUser}
              friendRequests={friendRequests}
              sessions={sessions}
              totalNotifications={totalNotifications}
              className="mr-2" // Add margin to separate from menu icon
              onItemClick={() => setIsOpen(false)} // Close mobile sidebar when notification is clicked
            />
            {/* Mobile Menu Button */}
            {!isOpen && (
              <motion.button
                className="p-2 rounded-full hover:bg-foreground/5 dark:hover:bg-foreground/10
                         transition-colors duration-300"
                onClick={() => setIsOpen(true)} // Open sidebar
                whileTap={{ scale: 0.9 }}
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
    )}

    {/* Mobile Sidebar Component */}
    <MobileSidebar
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      navigationItems={navigationItems}
      isActivePath={isActivePath}
      user={displayUser}
      onSignOut={handleSignOut}
      isSigningOut={isSigningOut}
    />
    </>
  );
}
