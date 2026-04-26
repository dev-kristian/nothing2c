'use client'
import React, { useRef, useState, useEffect } from 'react';
import { Media } from '@/types';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import MediaPoster from '../MediaPoster'; 
import SectionHeader from './SectionHeader'; 

interface SimilarContentProps {
  similar: Media[];
  mediaType: 'movie' | 'tv';
  title?: string;
  subtitle?: string;
}

const SimilarContent: React.FC<SimilarContentProps> = ({
  similar,
  mediaType,
  title = 'You May Also Like',
  subtitle,
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };
    
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [similar]);
  
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
      className="min-w-0 max-w-full overflow-hidden py-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <SectionHeader 
          title={title}
          subtitle={subtitle || `Similar ${mediaType === 'movie' ? 'movies' : 'shows'} you might enjoy`} 
        />
        
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => scrollTo('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-all ${
              !canScrollLeft
                ? 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
                : 'bg-muted/50 hover:bg-accent/20 text-foreground/80 hover:text-accent-foreground'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scrollTo('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-all ${
              !canScrollRight
                ? 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
                : 'bg-muted/50 hover:bg-accent/20 text-foreground/80 hover:text-accent-foreground'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      
      <div className="relative min-w-0">
        <div 
          ref={scrollContainerRef}
          className="flex min-w-0 gap-4 overflow-x-auto py-4 pb-8 no-scrollbar"
          onScroll={handleScroll}
        >
          {similar.map((item, index) => (
            <motion.div
              key={`${item.media_type || mediaType}-${item.id}`}
              className="flex-none w-48"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.05,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <MediaPoster 
                media={{ ...item, media_type: item.media_type || mediaType }}
                variant="default"
              />
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center mt-2">
        <div className="h-0.5 bg-muted rounded-full w-24 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
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
