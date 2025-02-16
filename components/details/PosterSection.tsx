import React from 'react';
import Image from 'next/image';
import { FaYoutube, FaGlobe, FaImdb, FaPlay } from 'react-icons/fa';
import { BookmarkMinus, BookmarkPlus } from 'lucide-react';

interface PosterSectionProps {
  posterPath: string | null | undefined;
  title: string;
  trailer?: { key: string };
  homepage?: string;
  imdbId?: string;
  id: number;
  isInWatchlist: boolean;
  onWatchlistClick: () => void;
  onTrailerClick: () => void;
  onWatchClick: () => void;
  isMovie: boolean;
}

const PosterSection: React.FC<PosterSectionProps> = ({
  posterPath,
  title,
  trailer,
  homepage,
  imdbId,
  isMovie,
  isInWatchlist,
  onWatchlistClick,
  onTrailerClick,
  onWatchClick
}) => {
  return (
    <div className="w-full md:w-1/3 lg:w-1/4">
      <div className="relative group">
        {posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w500${posterPath}`}
            alt={title || 'Poster'}
            width={500}
            height={750}
            className="rounded-lg shadow-2xl transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-[750px] bg-gray-800 flex items-center justify-center rounded-lg">
            <span className="text-gray-400">No poster available</span>
          </div>
        )}
        {trailer && (
          <>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-50 hidden md:flex">
              <button 
                className="bg-red-600 text-white py-2 px-4 rounded-full flex items-center space-x-2 hover:bg-red-700 transition-colors duration-300"
                onClick={onTrailerClick}
              >
                <FaYoutube />
                <span>Watch Trailer</span>
              </button>
            </div>
            <div className="absolute bottom-4 right-4 md:hidden">
              <button 
                className="bg-red-600 bg-opacity-70 text-white px-3 py-2 rounded-full flex items-center space-x-1 hover:bg-opacity-100 transition-all duration-300"
                onClick={onTrailerClick}
              >
                <FaYoutube size={16} />
                <span className="text-sm font-semibold">Trailer</span>
              </button>
            </div>
          </>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onWatchlistClick}
          className={`flex-grow py-2 px-4 rounded-full flex items-center justify-center space-x-2 transition-colors duration-300 ${
            isInWatchlist ? 'bg-gray-700 hover:bg-gray-600' : 'bg-pink-600 hover:bg-pink-700'
          }`}
        >
          {isInWatchlist ? (
            <BookmarkMinus className="w-5 h-5" />
          ) : (
            <BookmarkPlus className="w-5 h-5" />
          )}
          <span>{isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}</span>
        </button>

        {/* Watch Movie Button */}
        {isMovie && (
          <button
            onClick={onWatchClick}
            className="flex-grow py-2 px-4 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-2 transition-colors duration-300"
          >
            <FaPlay className="w-4 h-4" />
            <span>Watch Now</span>
          </button>
        )}

        {homepage && (
          <Button href={homepage} icon={FaGlobe} text="Website" />
        )}
        {imdbId && (
          <Button href={`https://www.imdb.com/title/${imdbId}`} icon={FaImdb} text="IMDb" color="yellow" />
        )}
      </div>
    </div>
  );
};

const Button: React.FC<{ 
  href: string; 
  icon: React.ElementType; 
  text: string; 
  color?: string 
}> = ({ href, icon: Icon, text, color = 'white' }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`
      flex items-center space-x-2 px-4 py-2 rounded-full transition-colors duration-300
      ${color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'}
    `}
  >
    <Icon />
    <span>{text}</span>
  </a>
);

export default PosterSection;
