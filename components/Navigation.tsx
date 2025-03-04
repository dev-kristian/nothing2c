// components/Navigation.tsx (No changes needed, but included for completeness)
'use client'

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import {
  LogOut, LogIn, ChevronDown,
  Menu, X, User as UserIcon, Settings,
  DraftingCompass,
  TvMinimalPlay,
  Share2,
  Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = useMemo(() => [
    { href: '/', icon: DraftingCompass, label: 'Discover' },
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
  }, [pathname]);

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
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 py-1 h-[var(--navbar-height)] transition-all duration-500 ${
        scrolled
          ? 'bg-background/60 dark:bg-background/30 backdrop-blur-xl shadow-lg'
          : 'bg-background/30 dark:bg-background/60 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14 relative nav-container">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Image
                src="/icons/popcorn.png"
                alt="Popcorn icon"
                width={28}
                height={28}
                className="drop-shadow-lg"
                priority
              />
            </motion.div>
            <span className="text-2xl font-bold text-gradient">
              AFK Cinema
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map(({ href, icon: Icon, label }) => (
              <motion.div
                key={href}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300
                    ${isActivePath(href)
                      ? 'bg-primary/10 text-primary dark:bg-primary/20'
                      : 'hover:bg-foreground/5 dark:hover:bg-foreground/10'
                    }`}
                >
                  <Icon className={`h-4 w-4 ${isActivePath(href) ? 'text-primary' : ''}`} />
                  <span className="font-medium">{label}</span>
                </Link>
              </motion.div>
            ))}

            {user ? (
              <div className="relative ml-2">
                <motion.button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-foreground/5 
                           dark:hover:bg-foreground/10 transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="User avatar"
                      width={28}
                      height={28}
                      className="rounded-full ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </motion.button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="absolute right-0 mt-2 w-56 frosted-glass rounded-2xl shadow-lg overflow-hidden"
                    >
                      <div className="p-2 space-y-1">
                        <Link
                          href="/settings"
                          className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-foreground/5 
                                   dark:hover:bg-foreground/10 transition-colors duration-200"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </Link>

                        <div className="h-px bg-foreground/10" />

                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-foreground/5 
                                   dark:hover:bg-foreground/10 transition-colors duration-200 text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
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
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-primary text-primary-foreground 
                           hover:bg-primary-hover transition-colors duration-300 shadow-lg"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 rounded-full hover:bg-foreground/5 dark:hover:bg-foreground/10 
                     transition-colors duration-300"
            onClick={() => setIsOpen(!isOpen)}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
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
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:hidden absolute w-full frosted-glass bg-white dark:bg-black rounded-b-2xl shadow-lg overflow-hidden"
          >
            <div className="px-4 py-3 space-y-2">
              {navigationItems.map(({ href, icon: Icon, label }) => (
                <motion.div
                  key={href}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActivePath(href)
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-foreground/5 dark:hover:bg-foreground/10'
                      }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{label}</span>
                  </Link>

                </motion.div>
              ))}

              <div className="h-px bg-foreground/10 my-2" />

              {user ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-foreground/5 
                           dark:hover:bg-foreground/10 transition-colors duration-200 text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </motion.button>
              ) : (
                <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/signin"
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground 
                             hover:bg-primary-hover transition-colors duration-200"
                    onClick={() => setIsOpen(false)}
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
                  </Link>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}