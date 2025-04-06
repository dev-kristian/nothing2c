'use client'
import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Media } from '@/types';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Star } from 'lucide-react';

interface SimilarContentProps {
  similar: Media[];
  mediaType: 'movie' | 'tv';
}

const SimilarContent: React.FC<SimilarContentProps> = ({ similar, mediaType }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Check scroll possibility on mount and window resize
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
      }
    };
    
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [similar]);
  
  // Handle scroll events
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };
  
  const scrollTo = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  if (!similar || similar.length === 0) {
    return null;
  }

  return (
    <motion.section 
      className="mt-16 mb-8 px-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header with Apple-style typography */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium tracking-tight ">
            You May Also Like
          </h2>
          <p className="text-sm  mt-1">
            Similar {mediaType === 'movie' ? 'movies' : 'shows'} you might enjoy
          </p>
        </div>
        
        {/* Navigation controls with Apple-style minimal buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollTo('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-all duration-300 ${
              canScrollLeft 
                ? 'bg-white/10 hover:bg-white/15 ' 
                : 'bg-white/5  cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scrollTo('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-all duration-300 ${
              canScrollRight 
                ? 'bg-white/10 hover:bg-white/15 ' 
                : 'bg-white/5  cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      {/* Content scroller with fade edges */}
      <div className="relative">
        {/* Scrollable content */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto no-scrollbar py-4 gap-5 pb-8"
          onScroll={handleScroll}
        >
          {similar.map((item, index) => (
            <motion.div
              key={item.id}
              className="flex-none w-48"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: index * 0.05, 
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              whileHover={{ y: -8 }}
            >
              <Link href={`/details/${mediaType}/${item.id}`} className="block">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden">
                  {/* Poster image */}
                  {item.poster_path ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                        alt={item.title || item.name || ''}
                        fill
                        sizes="(max-width: 768px) 100vw, 192px"
                        className="object-cover transition-transform duration-500"
                        style={{
                          transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)'
                        }}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}`}></div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <span className=" text-sm">No Image</span>
                    </div>
                  )}
                  
                  {/* Rating badge */}
                  <div className={`absolute bottom-3 left-3 flex items-center space-x-1 bg-black/30 backdrop-blur-md px-2 py-1 rounded-md transition-all duration-300 ${hoveredIndex === index ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'}`}>
                    <Star size={12} className="text-pink fill-pink" />
                    <span className="text-xs font-medium ">{item.vote_average.toFixed(1)}</span>
                  </div>
                </div>
                
                {/* Content info with Apple-like typography */}
                <div className="mt-3 px-1">
                  <h3 className="font-medium text-sm  leading-tight truncate">
                    {item.title || item.name}
                  </h3>
                  <p className="text-xs  mt-1">
                    {new Date(item.release_date || item.first_air_date || '').getFullYear() || 'Unknown year'}
                  </p>
                </div>
                
                {/* Animated "Play" button that appears on hover */}
                <motion.div 
                  className="mt-2 px-1"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ 
                    opacity: hoveredIndex === index ? 1 : 0,
                    y: hoveredIndex === index ? 0 : 5
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-center py-1.5 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-200">
                    <span className="text-xs font-medium ">View Details</span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Progress indicator in Apple style */}
      <div className="flex justify-center mt-2">
        <div className="h-0.5 bg-white/10 rounded-full w-24 overflow-hidden">
          <motion.div 
            className="h-full bg-white/50 rounded-full"
            style={{
              width: scrollContainerRef.current 
                ? `${Math.min(100, (scrollContainerRef.current.scrollLeft / (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth)) * 100)}%` 
                : '0%'
            }}
          />
        </div>
      </div>
    </motion.section>
  );
};

export default SimilarContent;