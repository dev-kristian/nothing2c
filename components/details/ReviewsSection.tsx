'use client'
import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import { Review } from '@/types';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronDown, User, MessageSquare, Plus } from 'lucide-react';
import DOMPurify from 'dompurify'; 
import { Button } from '@/components/ui/button';
import SectionHeader from './SectionHeader'; 

const REVIEWS_PER_PAGE = 5;
const INITIAL_VISIBLE_LINES = 3; 
const LINE_HEIGHT_APPROX = 1.625;

const getAvatarUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  return path.startsWith('/https')
    ? path.slice(1)
    : `https://image.tmdb.org/t/p/w92${path}`;
};

const sanitizeHTML = (htmlString: string): string => {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(htmlString, { USE_PROFILES: { html: true } });
  }
  return htmlString; 
};

interface ReviewsSectionProps {
  reviews: Review[];
  mediaTitle?: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews, mediaTitle = 'this title' }) => {
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);

  const sortedReviews = useMemo(() => {
    if (!reviews?.length) return [];
    return [...reviews].sort((a, b) => {
      try {
        const dateA = a.created_at ? parseISO(a.created_at).getTime() : 0;
        const dateB = b.created_at ? parseISO(b.created_at).getTime() : 0;
        return dateB - dateA;
      } catch (error) {
        console.error("Error parsing review date:", error);
        return 0;
      }
    });
  }, [reviews]);

  const handleShowMoreReviews = () => {
    setVisibleCount(prevCount => prevCount + REVIEWS_PER_PAGE);
  };

  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const hasMoreReviews = visibleCount < sortedReviews.length;

  if (!sortedReviews?.length) {
    return <NoReviewsState mediaTitle={mediaTitle} />;
  }

  return (
    <section className="py-4">
      <SectionHeader 
        title="Reviews" 
        subtitle={`${sortedReviews.length} ${sortedReviews.length === 1 ? 'Review' : 'Reviews'}`} 
      />
      <div className="space-y-4 mt-6"> 
        <AnimatePresence initial={false}>
          {visibleReviews.map((review, index) => (
            <ReviewCard
              key={review.id || `review-${index}`}
              review={review}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>

      {hasMoreReviews && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="secondary" 
            onClick={handleShowMoreReviews}
            className="transition-colors duration-300 group text-sm px-6 py-3 rounded-xl focus:ring-2 focus:ring-primary/30 shadow-apple-sm hover:shadow-apple" // Removed pink classes, adjusted focus ring
          >
            <Plus className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
            Show More Reviews
          </Button>
        </div>
      )}
    </section>
  );
};

interface NoReviewsStateProps {
  mediaTitle: string;
}

const NoReviewsState: React.FC<NoReviewsStateProps> = ({ mediaTitle }) => (
  <section className="mt-12 mb-8 font-sans">
    <SectionHeader title="Reviews" />
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-6 rounded-2xl bg-system-background-secondary dark:bg-system-background-secondary-dark  p-10 flex flex-col items-center justify-center text-center gap-4 shadow-apple dark:shadow-apple-dark backdrop-blur-apple"
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
        <MessageSquare className="w-7 h-7 text-primary" /> 
      </div>
      <p className="text-foreground text-lg font-medium">No Reviews Yet</p>
      <p className="text-label-secondary dark:text-label-secondary-dark text-sm max-w-xs">
        There are no reviews available for &quot;{mediaTitle}&quot; at the moment.
      </p>
    </motion.div>
  </section>
);

interface ReviewCardProps {
  review: Review;
  index: number;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const animationDelay = (index % REVIEWS_PER_PAGE) * 0.08;
  const contentId = useId();

  const { author_details, created_at, content } = review;
  const { name, username, avatar_path, rating } = author_details || {};
  const authorName = name || review.author || 'Anonymous';
  const authorUsername = username || review.author;
  const avatarUrl = getAvatarUrl(avatar_path);
  const dateFormatted = created_at ? format(parseISO(created_at), 'MMMM d, yyyy') : 'Unknown date';

  useEffect(() => {
    const checkTruncation = () => {
      if (contentRef.current) {
        const singleLineHeight = 16 * LINE_HEIGHT_APPROX; 
        const maxHeight = singleLineHeight * INITIAL_VISIBLE_LINES;
        const actualHeight = contentRef.current.scrollHeight;
        setNeedsTruncation(actualHeight > maxHeight + 8);
      }
    };

    let timeoutId: NodeJS.Timeout;
    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkTruncation, 50);
    };

    debouncedCheck();
    const observer = new ResizeObserver(debouncedCheck);
    const node = contentRef.current; // Capture the ref value
    if (node) observer.observe(node);
    window.addEventListener('resize', debouncedCheck);

    return () => {
      clearTimeout(timeoutId);
      if (node) observer.unobserve(node); // Use the captured value in cleanup
      window.removeEventListener('resize', debouncedCheck);
      observer.disconnect();
    };
  }, [content]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        delay: animationDelay, 
        ease: [0.22, 1, 0.36, 1] 
      } 
    },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1] 
      } 
    }
  };

  const contentTransition = { 
    duration: 0.4, 
    ease: [0.22, 1, 0.36, 1] 
  }; 

  const contentVariants = {
    collapsed: { 
      maxHeight: `${INITIAL_VISIBLE_LINES * LINE_HEIGHT_APPROX}rem`, 
      opacity: 1 
    },
    expanded: { 
      maxHeight: '1000px', 
      opacity: 1 
    }
  };

  const overlayVariants = {
    hidden: { 
      opacity: 0, 
      transition: { 
        ...contentTransition, 
        delay: 0 
      } 
    },
    visible: { 
      opacity: 1, 
      transition: { 
        ...contentTransition, 
        delay: 0.05 
      } 
    }
  };

  return (
    <motion.div
      layout
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-system-background-tertiary dark:bg-system-background-tertiary-dark rounded-2xl overflow-hidden shadow-apple dark:shadow-apple-dark transition-all duration-300 hover:shadow-apple-lg dark:hover:shadow-apple-dark-lg"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-5 dark:bg-gray-5-dark flex-shrink-0  flex items-center justify-center shadow-apple-sm">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={authorName} fill className="object-cover" sizes="48px" unoptimized />
              ) : (
                <User className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-base text-foreground truncate" title={authorName}>{authorName}</p>
              <p className="text-sm text-label-secondary dark:text-label-secondary-dark truncate" title={`@${authorUsername} • ${dateFormatted}`}>
                {authorUsername && `@${authorUsername} • `}{dateFormatted}
              </p>
            </div>
          </div>
          {rating !== null && rating !== undefined && <RatingStars rating={rating} />}
        </div>

        <div className="relative">
          <motion.div
             className="overflow-hidden"
             initial="collapsed"
             animate={isExpanded ? "expanded" : "collapsed"}
              variants={contentVariants}
              transition={contentTransition}
          >
            <div
              ref={contentRef}
              id={contentId}
              className="text-base text-foreground/90 leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-p:text-inherit prose-a:text-primary hover:prose-a:text-primary/90 font-smoothing-antialiased" // text-pink -> text-primary, hover:text-pink-dark -> hover:text-primary/90
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
            />
          </motion.div>

          {needsTruncation && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-system-background-tertiary dark:from-system-background-tertiary-dark to-transparent pointer-events-none"
              initial="visible"
              animate={isExpanded ? "hidden" : "visible"}
              variants={overlayVariants}
            />
          )}
        </div>

        {needsTruncation && (
          <button
            onClick={toggleExpand}
            aria-expanded={isExpanded}
            aria-controls={contentId}
            className="mt-3 text-sm font-medium text-pink hover:text-pink/90 transition-colors duration-200 flex items-center gap-1 px-2 py-1 -ml-2" // text-pink -> text-primary, hover:text-pink-dark -> hover:text-primary/90, focus:ring-pink/30 -> focus:ring-primary/30
          >
            {isExpanded ? 'Show Less' : 'Show More'}
            <motion.div 
              animate={{ rotate: isExpanded ? 180 : 0 }} 
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        )}
      </div>
    </motion.div>
  );
};

interface RatingStarsProps {
  rating: number;
}

const RatingStars: React.FC<RatingStarsProps> = ({ rating }) => {
  const starValue = Math.max(0, Math.min(10, rating)) / 2;
  const fullStars = Math.floor(starValue);
  const hasHalfStar = starValue % 1 >= 0.3;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);


  return (
    <div className="flex gap-1 items-center flex-shrink-0 bg-gray-6 dark:bg-gray-6-dark px-3 py-1.5 rounded-full shadow-apple-inner" title={`Rated ${rating}/10`}>
      <span className="text-xs font-medium text-label-secondary dark:text-label-secondary-dark mr-1">{(rating / 2).toFixed(1)}</span>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} fill="currentColor" className="w-4 h-4 text-pink" strokeWidth={1.5} />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <Star className="w-4 h-4 text-pink" strokeWidth={1.5} /> 
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star fill="currentColor" className="w-4 h-4 text-pink" strokeWidth={1.5} />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} fill="transparent" className="w-4 h-4 text-label-quaternary dark:text-label-quaternary-dark" strokeWidth={1.5} />
      ))}
    </div>
  );
};

export default ReviewsSection;
