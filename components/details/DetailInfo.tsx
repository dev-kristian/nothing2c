'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Globe, Calendar, TrendingUp, Coins, BarChart3, Play, Tv, MapPinned, BadgeCheck } from 'lucide-react';
import { ContentRatingsResponse, ReleaseDatesResponse } from '@/types';

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
  contentRating?: string | null;
  releaseDates?: ReleaseDatesResponse;
  contentRatings?: ContentRatingsResponse;
  defaultRegion?: string;
}

const REGION_LABELS: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  HU: 'Hungary',
  CA: 'Canada',
  AU: 'Australia',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  JP: 'Japan',
  KR: 'South Korea',
  IN: 'India',
  BR: 'Brazil',
  MX: 'Mexico',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  PL: 'Poland',
};

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
  contentRating,
  releaseDates,
  contentRatings,
  defaultRegion = 'US',
}) => {
  const formatNumber = (value: number) => {
    const absValue = Math.abs(value);
    const compactValue =
      absValue >= 1_000_000_000
        ? { amount: value / 1_000_000_000, suffix: 'B' }
        : absValue >= 1_000_000
          ? { amount: value / 1_000_000, suffix: 'M' }
          : absValue >= 1_000
            ? { amount: value / 1_000, suffix: 'K' }
            : null;

    if (!compactValue) {
      return `$${value.toLocaleString('en-US')}`;
    }

    const roundedAmount = Number(compactValue.amount.toFixed(1));
    return `$${roundedAmount}${compactValue.suffix}`;
  };

  const formatInteger = (value: number) => value.toLocaleString('en-US');
  const [selectedRegion, setSelectedRegion] = useState(defaultRegion);

  const availableRegions = useMemo(() => {
    const nextRegions = new Set<string>();

    releaseDates?.results?.forEach((result) => nextRegions.add(result.iso_3166_1));
    contentRatings?.results?.forEach((result) => nextRegions.add(result.iso_3166_1));

    if (defaultRegion) {
      nextRegions.add(defaultRegion);
    }

    if (nextRegions.size === 0) {
      nextRegions.add('US');
    }

    return Array.from(nextRegions).sort((a, b) => {
      if (a === defaultRegion) return -1;
      if (b === defaultRegion) return 1;
      return a.localeCompare(b);
    });
  }, [contentRatings?.results, defaultRegion, releaseDates?.results]);

  useEffect(() => {
    if (!availableRegions.includes(selectedRegion)) {
      setSelectedRegion(availableRegions[0] || 'US');
    }
  }, [availableRegions, selectedRegion]);

  const regionalReleaseInfo = useMemo(() => {
    const regionRelease = releaseDates?.results?.find((result) => result.iso_3166_1 === selectedRegion);

    if (!regionRelease) {
      return null;
    }

    const preferredEntry =
      regionRelease.release_dates.find((entry) => entry.type === 3 || entry.type === 2) ||
      regionRelease.release_dates.find((entry) => Boolean(entry.certification)) ||
      regionRelease.release_dates[0];

    if (!preferredEntry) {
      return null;
    }

    const releaseDate = new Date(preferredEntry.release_date);
    const formattedDate = Number.isNaN(releaseDate.getTime())
      ? 'N/A'
      : new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).format(releaseDate);

    return {
      certification: preferredEntry.certification || contentRating || 'N/A',
      date: formattedDate,
    };
  }, [contentRating, releaseDates?.results, selectedRegion]);

  const regionalTvRating = useMemo(() => {
    const regionRating = contentRatings?.results?.find((entry) => entry.iso_3166_1 === selectedRegion);
    return regionRating?.rating || contentRating || 'N/A';
  }, [contentRating, contentRatings?.results, selectedRegion]);

  const getRatingClass = (rating: number | undefined) => {
    if (!rating) return 'text-muted-foreground';
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
      <div className="rounded-3xl space-y-12 max-w-7xl mx-auto sm:px-6 lg:px-8"> 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:justify-between">
            <div className="w-full sm:w-auto">
              <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {tagline && (
                <p className="text-lg sm:text-2xl text-muted-foreground font-light">
                  {tagline}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end mt-4 sm:mt-0">
              <div className="text-2xl sm:text-4xl font-light tracking-tight">
                <span className={getRatingClass(voteAverage)}>
                  {voteAverage?.toFixed(1)}
                </span>
                <span className="text-muted-foreground text-lg sm:text-2xl ml-2">/ 10</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatInteger(voteCount)} ratings
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-[2.5fr,1.5fr] gap-4 md:gap-12 lg:gap-16">
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            <div >
              <h3 className="text-sm font-medium text-muted-foreground tracking-wider uppercase">About</h3>
              <p className="text-lg sm:text-xl leading-relaxed text-foreground font-light">
                {overview}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground tracking-wider uppercase">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {genres.split(', ').filter(Boolean).map(genre => (
                  <motion.span
                    key={genre}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground
                             backdrop-blur-sm text-sm tracking-wide"
                  >
                    {genre}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {(!isMovie || (isMovie && ((budget && budget !== 0) || (revenue && revenue !== 0))))
            ? (
              <div className="bg-card backdrop-blur-xl rounded-2xl overflow-hidden"> 
                <div className="px-4 py-4 border-b border-border  bg-secondary backdrop-blur-sm">
                  <h3 className="text-sm font-medium text-muted-foreground  tracking-wider uppercase">
                  {isMovie ? "Movie Details" : "Series Information"}
                </h3>
              </div>

              <div className="divide-y divide-border">
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
                    {(budget && revenue && budget !== 0 && revenue !== 0) ? (
                      <StatRow
                        icon={TrendingUp}
                        label="Return"
                        value={`${((revenue / budget - 1) * 100).toFixed(1)}%`}
                        highlight={revenue > budget}
                      />
                    ) : null}
                  </>
                )}
              </div>
            </div>
            ) : null }

            <div className="flex items-center justify-between bg-secondary backdrop-blur-sm px-4 py-4 bg-card backdrop-blur-xl rounded-2xl">
              <span className="text-sm text-muted-foreground  tracking-wider uppercase">Status</span>
              <span className="text-sm font-medium text-foreground">{status}</span> 
            </div>

            <div className="rounded-2xl overflow-hidden bg-card backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-4">
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Region Support</h3>
                </div>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none"
                >
                  {availableRegions.map((region) => (
                    <option key={region} value={region}>
                      {REGION_LABELS[region] || region}
                    </option>
                  ))}
                </select>
              </div>

              <div className="divide-y divide-border">
                <StatRow
                  icon={MapPinned}
                  label="Selected Region"
                  value={`${REGION_LABELS[selectedRegion] || selectedRegion} (${selectedRegion})`}
                />
                <StatRow
                  icon={Calendar}
                  label="Regional Release"
                  value={regionalReleaseInfo?.date || releaseDate}
                />
                <StatRow
                  icon={BadgeCheck}
                  label="Certification"
                  value={isMovie ? (regionalReleaseInfo?.certification || contentRating || 'N/A') : regionalTvRating}
                />
              </div>
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
  <div>
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon size={16} />
      <span className="text-xs tracking-wider uppercase">{label}</span>
    </div>
    <p className="text-base sm:text-lg font-light text-foreground">
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
  <div className="px-4 py-2 flex items-center bg-secondary backdrop-blur-sm justify-between ">
    <div className="flex items-center">
      <div className="w-8 h-8 rounded-full flex items-center justify-center">
        <Icon size={16} className="text-secondary-foreground" />
      </div>
      <span className="text-sm text-foreground/80 ">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-base text-sm ${highlight ? 'text-emerald-400' : 'text-foreground/90'}`}>
        {value}
      </span>
    </div>
  </div>
);

export default DetailInfo;
