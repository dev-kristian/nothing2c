// app/(root)/search/[searchquery]/SearchResultsContent.tsx
'use client'
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MoviePoster from '@/components/MediaPoster';
import { Media } from '@/types';

interface SearchResultsContentProps {
  results: Media[];
}

export default function SearchResultsContent({ results }: SearchResultsContentProps) {
  return (
    <AnimatePresence>
      {results && results.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {results.map((movie: Media) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <MoviePoster media={movie} showMediaType={true} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.p 
          className="text-center text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          No results found.
        </motion.p>
      )}
    </AnimatePresence>
  );
}