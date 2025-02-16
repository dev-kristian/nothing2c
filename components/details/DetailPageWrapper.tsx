'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import { DetailsData, VideoData } from '@/types';
import { format } from 'date-fns';
import { useUserData } from '@/context/UserDataContext';
import YouTubeEmbed from './YoutubeEmbed';
import FlickyEmbed from './HostEmbed'; 
import DetailInfo from './DetailInfo';
import PosterSection from './PosterSection';

interface DetailPageWrapperProps {
  details: DetailsData;
  videos: VideoData[];
}

const DetailPageWrapper: React.FC<DetailPageWrapperProps> = ({ details, videos }) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [showFlickyEmbed, setShowFlickyEmbed] = useState(false); // New state
  const { userData, addToWatchlist, removeFromWatchlist } = useUserData();
  
  const isMovie = 'title' in details;
  const title = isMovie ? details.title : details.name;
  const releaseDate = isMovie ? details.release_date : details.first_air_date;
  const formattedReleaseDate = releaseDate 
    ? format(new Date(releaseDate), 'dd MMMM yyyy')
    : 'N/A';
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

  const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');

  const isInWatchlist = userData?.watchlist[isMovie ? 'movie' : 'tv'][details.id.toString()];

  const handleWatchlistClick = () => {
    if (isInWatchlist) {
      removeFromWatchlist(details.id, isMovie ? 'movie' : 'tv');
    } else {
      addToWatchlist(details, isMovie ? 'movie' : 'tv');
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      <div className="absolute inset-0">
        <Image
          src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
          alt={title || 'Backdrop'}
          fill
          sizes="100vw"
          priority
          className="opacity-30 object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent"></div>
      <div className="relative container mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
        <PosterSection
          posterPath={details.poster_path || undefined}
          title={title!}
          trailer={trailer}
          homepage={details.homepage}
          imdbId={details.external_ids?.imdb_id}  // Use external_ids for both types
          id={details.id}
          isMovie={isMovie}
          isInWatchlist={isInWatchlist ?? false}
          onWatchlistClick={handleWatchlistClick}
          onTrailerClick={() => setShowTrailer(true)}
          onWatchClick={() => setShowFlickyEmbed(true)}
        />
          <div className="w-full md:w-2/3 lg:w-3/4 space-y-6 md:space-y-8">
            <DetailInfo
              title={title!}
              releaseYear={releaseYear}
              genres={details.genres.map(g => g.name).join(', ')}
              voteAverage={details.vote_average}
              voteCount={details.vote_count}
              tagline={details.tagline}
              overview={details.overview}
              isMovie={isMovie}
              runtime={isMovie ? details.runtime ?? 0 : details.episode_run_time?.[0] ?? 0}
              language={details.spoken_languages?.[0]?.english_name || 'N/A'}
              releaseDate={formattedReleaseDate}
              seasons={!isMovie ? details.number_of_seasons : undefined}
              episodes={!isMovie ? details.number_of_episodes : undefined}
            />
          </div>
        </div>
      </div>
 
      {showTrailer && trailer && (
        <YouTubeEmbed 
          videoId={trailer.key} 
          onClose={() => setShowTrailer(false)} 
        />
      )}

      {/* New Flicky Embed Modal */}
      {showFlickyEmbed && isMovie && (
        <FlickyEmbed 
          tmdbId={details.id} 
          onClose={() => setShowFlickyEmbed(false)} 
        />
      )}
    </div>
  );
};

export default DetailPageWrapper;
