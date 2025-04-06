'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { CrewMember } from '@/types';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';

interface CrewCarouselProps {
  cast: CrewMember[];
  crew: CrewMember[];
  isLoading: boolean;
  error: string | null;
}

const CrewCarousel: React.FC<CrewCarouselProps> = ({ 
  cast, 
  crew, 
  isLoading,
  error 
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null);

  // Merge and deduplicate crew members
  const mergedCrewMembers = useMemo(() => {
    const memberMap = new Map<number, CrewMember & { roles: string[] }>();

    const addMember = (member: CrewMember, role: string) => {
      if (memberMap.has(member.id)) {
        const existingMember = memberMap.get(member.id)!;
        if (!existingMember.roles) {
          existingMember.roles = [];
        }
        existingMember.roles.push(role);
      } else {
        memberMap.set(member.id, { 
          ...member, 
          roles: [role] 
        });
      }
    };

    // Process cast and crew
    cast.forEach(member => addMember(member, member.character || 'Cast'));
    crew.forEach(member => addMember(member, member.job || 'Crew'));

    return Array.from(memberMap.values());
  }, [cast, crew]);

  // Update container width for scroll calculations
  useEffect(() => {
    if (scrollContainerRef) {
      setContainerWidth(scrollContainerRef.scrollWidth - scrollContainerRef.clientWidth);
    }
  }, [scrollContainerRef, mergedCrewMembers]);

  // Handle scroll navigation
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef) return;
    
    const scrollAmount = scrollContainerRef.clientWidth * 0.75;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(containerWidth, scrollPosition + scrollAmount);
    
    scrollContainerRef.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    
    setScrollPosition(newPosition);
  };

  // Handle scroll events to update position state - memoized with useCallback
  const handleScrollEvent = useCallback(() => {
    if (scrollContainerRef) {
      setScrollPosition(scrollContainerRef.scrollLeft);
    }
  }, [scrollContainerRef]);

  useEffect(() => {
    const currentRef = scrollContainerRef;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScrollEvent);
      return () => currentRef.removeEventListener('scroll', handleScrollEvent);
    }
  }, [scrollContainerRef, handleScrollEvent]);

  // Check if we're at the beginning or end of scroll
  const isAtStart = scrollPosition <= 0;
  const isAtEnd = scrollPosition >= containerWidth;

  if (error) {
    return (
      <div className="w-full py-12 flex items-center justify-center">
        <p className="text-red-400 text-sm font-medium bg-red-400/10 px-4 py-3 rounded-xl">
          {error}
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto">
        {/* Combined Header and Navigation Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <motion.h2 
              className="text-3xl font-semibold tracking-tight text-white"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Cast & Crew
            </motion.h2>
            <motion.p 
              className="text-sm text-white/50 mt-1"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              The talented people behind this production
            </motion.p>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleScroll('left')}
              disabled={isAtStart}
              className={`p-2 rounded-full ${
                isAtStart 
                  ? 'bg-white/5 text-white/20' 
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              } transition-all`}
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => handleScroll('right')}
              disabled={isAtEnd}
              className={`p-2 rounded-full ${
                isAtEnd 
                  ? 'bg-white/5 text-white/20' 
                  : 'bg-white/10 hover:bg-white/20 text-white/80'
              } transition-all`}
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        {/* Card Container */}
        <motion.div 
          className="relative"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Conditional Gradient Edges */}
          <AnimatePresence>
            {!isAtStart && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-0 bottom-0 w-12  bg-gradient-to-r from-black to-transparent pointer-events-none"
              ></motion.div>
            )}
            
            {!isAtEnd && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none"
              ></motion.div>
            )}
          </AnimatePresence>
          
          {/* Scroll Container */}
          <div 
            ref={setScrollContainerRef}
            className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar"
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div className="flex items-center justify-center w-full min-h-40">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    <div className="w-8 h-8 border-2 border-white/10 border-t-white/80 rounded-full animate-spin"></div>
                    <p className="text-white/50 text-sm">Loading cast & crew...</p>
                  </motion.div>
                </div>
              ) : (
                mergedCrewMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: 0.05 * Math.min(index, 10) }
                    }}
                    className="flex-none w-48"
                  >
                    <motion.div 
                      className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm"
                      whileHover={{ 
                        y: -5,
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      {member.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w300${member.profile_path}`}
                          alt={member.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 192px"
                          className="object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                          <User size={48} className="text-white/20" />
                        </div>
                      )}
                      
                      {/* Glass-like info overlay at bottom */}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-md p-3 transform transition-transform">
                        <h3 className="font-medium text-white text-base leading-tight truncate">
                          {member.name}
                        </h3>
                        <p className="text-xs text-white/70 mt-1 line-clamp-1">
                          {member.roles?.join(', ') || 'Crew Member'}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        
        {/* Count Indicator */}
        <div className="text-center">
          <p className="text-sm text-white/50">
            Showing all {mergedCrewMembers.length} cast & crew members
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default CrewCarousel;
