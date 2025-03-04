import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Globe, Calendar, TrendingUp, Coins, BarChart3, Play, Tv } from 'lucide-react';

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
  budget?: number;
  revenue?: number;
  status: string;
}

const DetailInfo: React.FC<DetailInfoProps> = ({
  title,
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
  episodes,
  budget,
  revenue,
  status,
}) => {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getRatingClass = (rating: number | undefined) => {
    if (!rating) return 'text-gray-500';
    if (rating >= 8) return 'text-emerald-400';
    if (rating >= 6) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden"
    >
      <div className="rounded-3xl space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> 
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:justify-between"> 
            <div className="space-y-4 w-full sm:w-auto"> 
              <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white"> 
                {title}
              </h1>
              {tagline && (
                <p className="text-lg sm:text-2xl text-white/60 font-light"> 
                  {tagline}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-3 mt-4 sm:mt-0">
              <div className="text-2xl sm:text-4xl font-light tracking-tight">
                <span className={getRatingClass(voteAverage)}>
                  {voteAverage?.toFixed(1)}
                </span>
                <span className="text-white/30 text-lg sm:text-2xl ml-2">/ 10</span>
              </div>
              <div className="text-sm text-white/50">
                {voteCount.toLocaleString()} ratings
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-[2.5fr,1.5fr] gap-8 md:gap-12 lg:gap-16">
          {/* Left Column - Main Content */}
          <div className="space-y-12">
            {/* Key Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <KeyInfo
                label="Release Date"
                value={releaseDate}
                icon={Calendar}
              />
              <KeyInfo
                label="Runtime"
                value={`${runtime} Minutes`}
                icon={Clock}
              />
              <KeyInfo
                label="Language"
                value={language.toUpperCase()}
                icon={Globe}
              />
            </div>

            {/* Overview */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/40 tracking-wider uppercase">About</h3>
              <p className="text-lg sm:text-xl leading-relaxed text-white/80 font-light"> {/* Responsive font size */}
                {overview}
              </p>
            </div>

            {/* Genres */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white/40 tracking-wider uppercase">Genres</h3>
              <div className="flex flex-wrap gap-3">
                {genres.split(', ').map(genre => (
                  <motion.span
                    key={genre}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-6 py-2.5 rounded-full bg-white/[0.08] text-white/90
                             backdrop-blur-sm text-sm tracking-wide"
                  >
                    {genre}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="bg-white/[0.08] backdrop-blur-xl rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-medium text-white/40 tracking-wider uppercase">
                  {isMovie ? "Movie Details" : "Series Information"}
                </h3>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {!isMovie ? (
                  <>
                    <StatRow
                      icon={Tv}
                      label="Seasons"
                      value={seasons?.toString() || 'N/A'}
                    />
                    <StatRow
                      icon={Play}
                      label="Episodes"
                      value={episodes?.toString() || 'N/A'}
                    />
                  </>
                ) : (
                  <>
                    <StatRow
                      icon={Coins}
                      label="Budget"
                      value={budget ? formatNumber(budget) : 'N/A'}
                    />
                    <StatRow
                      icon={BarChart3}
                      label="Revenue"
                      value={revenue ? formatNumber(revenue) : 'N/A'}
                    />
                    {budget && revenue && (
                      <StatRow
                        icon={TrendingUp}
                        label="Return"
                        value={`${((revenue / budget - 1) * 100).toFixed(1) }% `} 
                        highlight={revenue > budget}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.08] backdrop-blur-xl rounded-2xl">
              <span className="text-sm text-white/40 tracking-wider uppercase">Status</span>
              <span className="text-sm font-medium">{status}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const KeyInfo: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
}> = ({
  label,
  value,
  icon: Icon
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-white/40">
      <Icon size={16} />
      <span className="text-xs tracking-wider uppercase">{label}</span>
    </div>
    <p className="text-base sm:text-lg font-light"> {/* Responsive font size */}
      {value}
    </p>
  </div>
);

const StatRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean
}> = ({
  icon: Icon,
  label,
  value,
  highlight
}) => (
  <div className="px-6 py-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
    <div className="flex items-center gap-3">
      <Icon size={18} className="text-white/40" />
      <span className="text-sm">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className={highlight ? 'text-emerald-400' : ''}>
        {value}
      </span>
    </div>
  </div>
);

export default DetailInfo;