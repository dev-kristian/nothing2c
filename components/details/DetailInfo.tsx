// components/DetailInfo.tsx
import React from 'react';
import { FaUsers, FaClock, FaLanguage, FaCalendarAlt, FaTv } from 'react-icons/fa';

interface DetailInfoProps {
  title: string;
  releaseYear: string | number;
  genres: string;
  voteAverage: number | undefined;
  voteCount: number;
  tagline?: string;
  overview: string;
  isMovie: boolean;
  runtime: number;
  language: string;
  releaseDate: string;
  seasons?: number;
  episodes?: number;
}

const DetailInfo: React.FC<DetailInfoProps> = ({
  title,
  releaseYear,
  genres,
  voteAverage,
  voteCount,
  tagline,
  overview,
  isMovie,
  runtime,
  language,
  releaseDate,
  seasons,
  episodes
}) => {
  const getScoreColor = (score: number | undefined): string => {
    if (score === undefined) return 'bg-gray-500';
    if (score >= 7) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-2">{title}</h1>
        <p className="text-lg md:text-xl text-gray-400">{releaseYear} • {genres}</p>
        <div className="flex items-center flex-wrap gap-4 mt-4">
        <div className={`${getScoreColor(voteAverage)} rounded-2xl px-2 py-1 flex flex-col items-center justify-center`}>
          <div className="text-3xl font-bold">{voteAverage !== undefined ? voteAverage.toFixed(1) : 'N/A'}</div>
            <div className="w-full h-px bg-white opacity-50"></div>
            <div className="flex items-center">
              <FaUsers className="mr-1" />
              <span>{voteCount.toLocaleString()}</span>
            </div>
          </div>
          {tagline && (
            <p className="text-lg md:text-xl italic text-gray-300 ml-4">&quot;{tagline}&quot;</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Overview</h2>
        <p className="text-gray-300 leading-relaxed">{overview}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        <InfoItem icon={FaClock} label={isMovie ? "Runtime" : "Episode Runtime"} value={`${runtime} min`} />
        <InfoItem icon={FaLanguage} label="Language" value={language} />
        <InfoItem icon={FaCalendarAlt} label="Release Date" value={releaseDate} />
        {!isMovie && <InfoItem icon={FaTv} label="Seasons" value={seasons?.toString() || 'N/A'} />}
        {!isMovie && <InfoItem icon={FaTv} label="Episodes" value={episodes?.toString() || 'N/A'} />}
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-3">
    <Icon className="text-gray-400 text-xl" />
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  </div>
);

export default DetailInfo;