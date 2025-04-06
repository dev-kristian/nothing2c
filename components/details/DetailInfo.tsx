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
    if (!rating) return 'text-muted-foreground'; // Changed from text-gray-500
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
              <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-foreground"> {/* text-white -> text-foreground */}
                {title}
              </h1>
              {tagline && (
                <p className="text-lg sm:text-2xl text-muted-foreground font-light"> {/* text-white/60 -> text-muted-foreground */}
                  {tagline}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-3 mt-4 sm:mt-0">
              <div className="text-2xl sm:text-4xl font-light tracking-tight">
                <span className={getRatingClass(voteAverage)}>
                  {voteAverage?.toFixed(1)}
                </span>
                <span className="text-muted-foreground text-lg sm:text-2xl ml-2">/ 10</span> {/* text-white/30 -> text-muted-foreground */}
              </div>
              <div className="text-sm text-muted-foreground"> {/* text-white/50 -> text-muted-foreground */}
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
              <h3 className="text-sm font-medium text-muted-foreground tracking-wider uppercase">About</h3> {/* text-white/40 -> text-muted-foreground */}
              <p className="text-lg sm:text-xl leading-relaxed text-foreground font-light"> {/* text-white/80 -> text-foreground */}
                {overview}
              </p>
            </div>

            {/* Genres */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground tracking-wider uppercase">Genres</h3> {/* text-white/40 -> text-muted-foreground */}
              <div className="flex flex-wrap gap-3">
                {genres.split(', ').map(genre => (
                  <motion.span
                    key={genre}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-6 py-2.5 rounded-full bg-secondary text-secondary-foreground
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
            {/* Conditionally render the Details/Information card using ternary */}
            {(!isMovie || (isMovie && ((budget && budget !== 0) || (revenue && revenue !== 0))))
            ? (
              <div className="bg-card backdrop-blur-xl rounded-2xl overflow-hidden"> {/* bg-white/[0.08] -> bg-card */}
                <div className="px-6 py-4 border-b border-border  bg-secondary backdrop-blur-sm"> {/* border-white/[0.06] -> border-border */}
                  <h3 className="text-sm font-medium text-muted-foreground  tracking-wider uppercase"> {/* text-white/40 -> text-muted-foreground */}
                  {isMovie ? "Movie Details" : "Series Information"}
                </h3>
              </div>

              <div className="divide-y divide-border"> {/* divide-white/[0.06] -> divide-border */}
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
                      value={budget && budget !== 0 ? formatNumber(budget) : 'N/A'}
                    />
                    <StatRow
                      icon={BarChart3}
                      label="Revenue"
                      value={revenue && revenue !== 0 ? formatNumber(revenue) : 'N/A'}
                    />
                    {/* Conditional Return StatRow */}
                    {(budget && revenue && budget !== 0 && revenue !== 0) ? (
                      <StatRow
                        icon={TrendingUp}
                        label="Return"
                        value={`${((revenue / budget - 1) * 100).toFixed(1)}%`}
                        highlight={revenue > budget}
                      />
                    ) : null} {/* Explicitly return null */}
                  </>
                )}
              </div>
            </div>
            ) : null } {/* Explicitly return null if condition is false */}

            {/* Status Badge */}
            <div className="flex items-center justify-between bg-secondary backdrop-blur-sm px-6 py-4 bg-card backdrop-blur-xl rounded-2xl"> {/* bg-white/[0.08] -> bg-card */}
              <span className="text-sm text-muted-foreground  tracking-wider uppercase">Status</span> {/* text-white/40 -> text-muted-foreground */}
              <span className="text-sm font-medium text-foreground">{status}</span> {/* Added text-foreground */}
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
    <div className="flex items-center gap-2 text-muted-foreground"> {/* text-white/40 -> text-muted-foreground */}
      <Icon size={16} />
      <span className="text-xs tracking-wider uppercase">{label}</span>
    </div>
    <p className="text-base sm:text-lg font-light text-foreground"> {/* Added text-foreground */}
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
  <div className="px-6 py-5 flex items-center  bg-secondary backdrop-blur-sm justify-between group hover:bg-muted/30 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full   flex items-center justify-center">
        <Icon size={16} className="text-secondary-foreground" />
      </div>
      <span className="text-sm font-medium text-foreground/80 ">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-base font-medium ${highlight ? 'text-emerald-400' : 'text-foreground/90'}`}>
        {value}
      </span>
    </div>
  </div>
);

export default DetailInfo;