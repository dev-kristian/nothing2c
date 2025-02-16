'use client'

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import {
  Home,
  Clock,
  Search,
  LogOut,
  LogIn,
  ChevronDown,
  Menu,
  X,
  User as UserIcon,
  Users,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Memoized navigation items
  const navigationItems = useMemo(() => [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/sessions', icon: Clock, label: 'Sessions' },
    { href: '/explore', icon: Search, label: 'Explore' },
    { href: '/friends', icon: Users, label: 'Friends' },
  ], []);

  // Handle scroll effect with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScrolled(window.scrollY > 20);
      }, 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.nav-container')) {
        setIsOpen(false);
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/sign-in');
      setIsOpen(false);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActivePath = (path: string) => pathname === path;

  return (
    <nav 
      className={`fixed w-full z-10 py-1 h-[var(--navbar-height)] transition-all duration-300 ${
        scrolled ? 'bg-background/80 backdrop-blur-md shadow-lg' : 'bg-background/50 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto px-4">
        <div className="flex justify-between items-center relative nav-container">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 group"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/icons/popcorn.png"
                alt="Popcorn icon"
                width={24}
                height={24}
                className="transition-transform"
                priority
              />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              AFK Cinema
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navigationItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-3xl transition-all duration-200
                  ${isActivePath(href)
                    ? 'text-accent'
                    : 'text-foreground/90 hover:text-accent'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}

            {user ? (
              <div className="relative ml-4">
                <motion.button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={isDropdownOpen ? 'Close user menu' : 'Open user menu'}
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="User avatar"
                      width={24}
                      height={24}
                      className="rounded-full hover:opacity-80 transition-opacity"
                      loading="eager"
                    />
                  ) : (
                    <UserIcon className="h-5 w-5 text-accent" />
                  )}
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </motion.button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 p-2 w-48 bg-background border border-accent/10 rounded-lg shadow-lg py-1 overflow-hidden"
                    >
                      <Link
                        href="/settings"
                        className="flex items-center space-x-2 rounded-xl w-full px-4 py-2 text-left text-foreground/90 hover:bg-accent/5 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                      </Link>
                      
                      <div className="my-1 border-t border-accent/10" />
                      
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 rounded-xl w-full px-4 py-2 text-left text-foreground/90 hover:bg-accent/5 transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/signin"
                  className="ml-4 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 rounded-lg hover:bg-accent/10 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute w-full bg-background rounded-b-xl shadow-lg overflow-hidden"
          >
            <div className="px-2 pt-2 pb-2 space-y-2">
              {navigationItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActivePath(href)
                      ? 'bg-accent/10 text-accent shadow-sm'
                      : 'hover:bg-accent/5'}`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </Link>
              ))}

              <div className="border-t border-accent/10 pt-2 mt-2">
                {user ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </motion.button>
                ) : (
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href="/signin"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors shadow-md"
                      onClick={() => setIsOpen(false)}
                    >
                      <LogIn className="h-5 w-5" />
                      <span>Sign In</span>
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
