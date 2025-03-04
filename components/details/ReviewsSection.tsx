'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Review } from '@/types';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Star, ChevronDown, ChevronUp, User, MessageSquare } from 'lucide-react';

interface ReviewsSectionProps {
  reviews: Review[];
  mediaTitle?: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews, mediaTitle = 'this title' }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <section className="mt-12 mb-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-medium tracking-tight">Reviews</h2>
        </div>
        <div className="rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10 p-8 flex flex-col items-center justify-center text-center gap-3">
          <MessageSquare className="w-8 h-8 text-white/40" />
          <p className="text-white/70 text-lg">No reviews available for {mediaTitle} yet.</p>
          <p className="text-white/50 text-sm">Check back later for audience opinions.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12 mb-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-medium tracking-tight">Reviews</h2>
        <p className="text-white/60 text-sm">
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
        </p>
      </div>
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <ReviewCard key={review.id} review={review} index={index} />
        ))}
      </div>
    </section>
  );
};

interface ReviewCardProps {
  review: Review;
  index: number;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const MAX_CHARACTERS = 280;
  const needsTruncation = review.content.length > MAX_CHARACTERS;

  const dateFormatted = format(parseISO(review.created_at), 'MMM d, yyyy');
  const username = review.author_details.username || review.author;
  const rating = review.author_details.rating;
  
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [review.content]);

  // Process markdown-like syntax in review content
  const processContent = (content: string) => {
    // Handle <em> tags
    let processedContent = content.replace(/<em>(.*?)<\/em>/g, (_, p1) => {
      return `<span class="italic text-white">${p1}</span>`;
    });
    
    // Handle **bold** markdown
    processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold">$1</span>');
    
    // Handle *italic* markdown
    processedContent = processedContent.replace(/\*(.*?)\*/g, '<span class="italic">$1</span>');
    
    // Handle _underscore_ markdown for italic
    processedContent = processedContent.replace(/_(.*?)_/g, '<span class="italic">$1</span>');
    
    // Handle `code` markdown
    processedContent = processedContent.replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Handle URLs
    processedContent = processedContent.replace(/(https?:\/\/[^\s]+)/g, '<span class="text-[#6bf]">$1</span>');
    
    return processedContent;
  };

  // Animation settings
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.23, 1, 0.32, 1] // Apple's default ease curve
      }
    }
  };

  const renderRating = () => {
    if (rating === null) return null;
    
    // Calculate full, half and empty stars
    const starValue = rating / 2; // Convert 10-scale to 5-scale
    const fullStars = Math.floor(starValue);
    const hasHalfStar = starValue % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <motion.div 
        className="flex gap-0.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          duration: 0.3, 
          delay: 0.1 + index * 0.1,
          staggerChildren: 0.05
        }}
      >
        {[...Array(fullStars)].map((_, i) => (
          <motion.div 
            key={`full-${i}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
          >
            <Star 
              fill="#FFCC00" 
              className="w-4 h-4 text-[#FFCC00]"
              strokeWidth={1.5}
            />
          </motion.div>
        ))}
        
        {hasHalfStar && (
          <motion.div 
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: fullStars * 0.05 }}
          >
            <Star className="w-4 h-4 text-[#FFCC00]" strokeWidth={1.5} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star fill="#FFCC00" className="w-4 h-4 text-[#FFCC00]" strokeWidth={1.5} />
            </div>
          </motion.div>
        )}
        
        {[...Array(emptyStars)].map((_, i) => (
          <motion.div 
            key={`empty-${i}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, delay: (fullStars + (hasHalfStar ? 1 : 0) + i) * 0.05 }}
          >
            <Star 
              fill="transparent" 
              className="w-4 h-4 text-white/20"
              strokeWidth={1.5}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-2xl overflow-hidden"
    >
      <div className="bg-black/30 backdrop-blur-sm border border-white/10 p-6 rounded-2xl transition-all duration-300 hover:bg-black/40">
        {/* Header with avatar, name, and rating */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-full overflow-hidden bg-white/5 flex items-center justify-center border border-white/10 shadow-sm">
              {review.author_details.avatar_path ? (
                <Image
                  src={review.author_details.avatar_path.startsWith('/https')
                    ? review.author_details.avatar_path.slice(1)
                    : `https://image.tmdb.org/t/p/w200${review.author_details.avatar_path}`}
                  alt={username}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              ) : (
                <User className="w-5 h-5 text-white/50" />
              )}
            </div>
            <div>
              <p className="font-medium text-white">{review.author_details.name || review.author}</p>
              <p className="text-sm text-white/60">
                {username !== (review.author_details.name || review.author) && `@${username} • `}
                {dateFormatted}
              </p>
            </div>
          </div>
          
          {/* Rating stars */}
          {renderRating()}
        </div>
        
        {/* Review content */}
        <motion.div 
          animate={{
            height: expanded || !needsTruncation ? contentHeight || 'auto' : '8em',
            transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] }
          }}
          className="relative overflow-hidden"
        >
          <div 
            ref={contentRef}
            className="text-white/85 leading-relaxed text-base prose prose-invert max-w-none prose-p:my-2 prose-p:text-white/85 space-y-3"
            dangerouslySetInnerHTML={{ 
              __html: processContent(review.content)
                .split('\n\n')
                .map(para => `<p>${para}</p>`)
                .join('')
            }}
          />
          
          {!expanded && needsTruncation && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          )}
        </motion.div>
        
        {/* Expand/collapse button */}
        {needsTruncation && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 flex items-center gap-1 group"
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                Show less
                <ChevronUp className="w-4 h-4 group-hover:transform group-hover:-translate-y-0.5 transition-transform duration-200" />
              </>
            ) : (
              <>
                Show more
                <ChevronDown className="w-4 h-4 group-hover:transform group-hover:translate-y-0.5 transition-transform duration-200" />
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default ReviewsSection;