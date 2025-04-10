'use client'

import Link from 'next/link';
import { User } from 'firebase/auth';
import { LogOut, Settings, X, LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigationItems: NavItem[];
  isActivePath: (path: string) => boolean;
  user: User | null;
  onSignOut: () => void;
  isSigningOut: boolean;
}

export default function MobileSidebar({
  isOpen,
  onClose,
  navigationItems,
  isActivePath,
  user,
  onSignOut,
  isSigningOut,
}: MobileSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-[80%] max-w-xs bg-white dark:bg-black shadow-lg z-50 md:hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            {/* Header */}
            <div className="p-2 flex justify-between items-center border-b border-foreground/10">
              <span className="font-semibold">Menu</span>
              <motion.button
                className="p-2 rounded-full hover:bg-foreground/5 dark:hover:bg-foreground/10
                           transition-colors duration-300"
                onClick={onClose}
                whileTap={{ scale: 0.9 }}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </motion.button>
            </div>

            {/* Navigation Links */}
            <div className="flex-grow p-4 space-y-2 overflow-y-auto">
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
                        ? 'bg-pink/10 text-pink' // Keep active style
                        : 'hover:bg-pink hover:text-primary-foreground focus:bg-pink focus:text-primary-foreground focus:outline-none' // Apply new hover/focus style
                      }`}
                    onClick={onClose} // Close sidebar on link click
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{label}</span>
                  </Link>
                </motion.div>
              ))}
              {/* Settings Link (if logged in) */}
              {user && (
                <motion.div
                  key="/settings"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/settings"
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActivePath('/settings')
                        ? 'bg-pink/10 text-pink' // Keep active style
                        : 'hover:bg-pink hover:text-primary-foreground focus:bg-pink focus:text-primary-foreground focus:outline-none' // Apply new hover/focus style
                      }`}
                    onClick={onClose} // Close sidebar on link click
                  >
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Settings</span>
                  </Link>
                </motion.div>
              )}
            </div>

            {/* Footer (Sign Out) */}
            <div className="p-4 border-t border-foreground/10">
              {user ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose(); // Close sidebar first
                    onSignOut(); // Then trigger sign out
                  }}
                  disabled={isSigningOut}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-pink hover:text-primary-foreground focus:bg-pink focus:text-primary-foreground focus:outline-none transition-colors duration-200 text-left disabled:opacity-50" // Apply new hover/focus style
                >
                  <LogOut className="h-5 w-5" />
                  <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                </motion.button>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
