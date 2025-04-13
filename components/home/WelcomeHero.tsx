"use client"

import { useAuthUser } from '@/context/AuthUserContext'; // Updated import
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface PosterImageProps {
  path: string;
  title: string;
  rating?: number;
  showRating?: boolean;
}

const WelcomeHeroSkeleton = () => (
  <div className="relative overflow-hidden rounded-3xl animate-pulse">
    <div className="frosted-panel border-0 py-8 px-6 sm:py-10 sm:px-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div className="space-y-4 w-full">
          <Skeleton className="h-8 w-48 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
        <div className="hidden md:block">
          <div className="relative h-48 w-48 lg:h-56 lg:w-56 flex-shrink-0 ml-4">
            <Skeleton className="absolute top-0 left-0 h-32 w-24 rounded-lg transform -rotate-6 z-10" />
            <Skeleton className="absolute top-4 right-0 h-36 w-24 rounded-lg transform rotate-6 z-20" />
            <Skeleton className="absolute bottom-0 left-8 h-32 w-24 rounded-lg transform -rotate-3 z-0" />
          </div>
        </div>
      </div>
    </div>
  </div>
);


export function WelcomeHero() {
  const { userData, isLoading } = useAuthUser(); // Use new hook
  const router = useRouter();

  const topRatedPosters = useMemo(() => {
    const movies = userData?.watchlist?.movie || [];
    const tvShows = userData?.watchlist?.tv || [];
    const allItems = [...movies, ...tvShows];
    
    const sortedItems = [...allItems].sort((a, b) => 
      (b.vote_average || 0) - (a.vote_average || 0)
    );
    
    return sortedItems
      .filter(item => item.poster_path)
      .slice(0, 3);
  }, [userData?.watchlist]);

  const fallbackPosters = [
    "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg", 
    "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", 
    "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg"  
  ];
  
  const currentHour = new Date().getHours();
  let greeting = "Good evening";
  let greetingEmoji = "✨";
  
  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Good morning";
    greetingEmoji = "☀️";
  } else if (currentHour >= 12 && currentHour < 18) {
    greeting = "Good afternoon";
    greetingEmoji = "🌤️";
  }

  // Show skeleton if loading OR if essential userData is not yet available
  if (isLoading || !userData) {
    return <WelcomeHeroSkeleton />;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background" />
      
      <div className="relative frosted-panel border-0 py-8 px-6 sm:py-10 sm:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="space-y-4 w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-sm text-sm">
              <span>{greetingEmoji}</span>
              <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight">
              {greeting}, <span className="text-pink">{userData?.username || "Cinephile"}</span>
            </h1>
            
            <p className="text-base text-foreground/70 max-w-md">
              {topRatedPosters.length > 0 
                ? "Continue exploring your personalized recommendations" 
                : "Ready to discover new films for your collection?"}
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <button 
                onClick={() => router.push('/')}
                className="button-primary"
              >
                Discover
              </button>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="relative h-48 w-48 lg:h-56 lg:w-56 flex-shrink-0 ml-4">
              <div className="absolute top-0 left-2 h-32 w-24 rounded-lg overflow-hidden shadow-lg transform -rotate-6 z-10">
                <PosterImage 
                  path={topRatedPosters[0]?.poster_path || fallbackPosters[0]} 
                  title={topRatedPosters[0]?.title || topRatedPosters[0]?.name || "Movie poster"}
                  rating={topRatedPosters[0]?.vote_average}
                  showRating={!!topRatedPosters[0]}
                />
              </div>
              
              <div className="absolute top-0 right-0 h-32 w-24 rounded-lg overflow-hidden shadow-lg transform rotate-6 z-20">
                <PosterImage 
                  path={topRatedPosters[1]?.poster_path || fallbackPosters[1]} 
                  title={topRatedPosters[1]?.title || topRatedPosters[1]?.name || "Movie poster"}
                  rating={topRatedPosters[1]?.vote_average}
                  showRating={!!topRatedPosters[1]}
                />
              </div>
              
              <div className="absolute top-20 left-14 h-32 w-24 rounded-lg overflow-hidden shadow-lg transform  z-0">
                <PosterImage 
                  path={topRatedPosters[2]?.poster_path || fallbackPosters[2]} 
                  title={topRatedPosters[2]?.title || topRatedPosters[2]?.name || "Movie poster"}
                  rating={topRatedPosters[2]?.vote_average}
                  showRating={!!topRatedPosters[2]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PosterImage = ({ path, title, rating, showRating = false }: PosterImageProps) => {
  const imagePath = path.startsWith('/') 
    ? `https://image.tmdb.org/t/p/w500${path}`
    : path;
    
  return (
    <div className="relative w-full h-full">
      <Image 
        src={imagePath} 
        alt={title} 
        fill 
        sizes="(max-width: 768px) 0px, (max-width: 1024px) 6rem, 8rem"
        className="object-cover"
        priority
      />
      
      {showRating && rating && (
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs font-medium px-1.5 py-0.5 rounded-md flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-0.5 text-yellow-400">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
          </svg>
          {rating.toFixed(1)}
        </div>
      )}
    </div>
  );
};
