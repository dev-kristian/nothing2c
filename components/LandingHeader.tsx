// components/LandingHeader.tsx
'use client'

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { LogIn, DraftingCompass } from 'lucide-react'; // Removed LogOut icon
import { motion } from 'framer-motion';
import { useAuthContext } from '@/context/AuthContext'; // Import context hook
// Button import no longer needed unless used elsewhere

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuthContext(); // Removed signOut destructuring

  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`sticky top-0 w-full z-50 py-1 h-[var(--navbar-height)] transition-all duration-500 ${
        scrolled
          ? 'bg-background/60 dark:bg-background/30 backdrop-blur-xl shadow-lg'
          : 'bg-background/30 dark:bg-background/60 backdrop-blur-md'
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

          <div className="flex items-center space-x-2">
            {user ? (
              // Show only "Go to App" if user is authenticated
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/discover"
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-pink text-white
                           hover:bg-pink-hover transition-colors duration-300 shadow-lg"
                >
                  <DraftingCompass className="h-4 w-4" />
                  <span>Go to App</span>
                </Link>
              </motion.div>
            ) : (
              // Show Sign In link if user is not authenticated
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}> {/* Motion for Sign In Link */}
                <Link
                  href="/sign-in"
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-pink text-white
                           hover:bg-pink-hover transition-colors duration-300 shadow-lg"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              </motion.div>
            )}
          </div> {/* Add missing closing tag for the div started on line 78 */}
        </div>
      </div>
    </motion.nav>
  );
}
