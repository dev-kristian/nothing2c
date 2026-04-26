'use client';

import React, { useMemo } from 'react';
import { Calendar, Clapperboard, MapPin, Star, UserRound } from 'lucide-react';
import SimilarContent from './SimilarContent';
import { Media, MediaCredit, PersonDetails } from '@/types';

interface PersonDetailPageProps {
  person: PersonDetails;
}

const MAX_CREDITS_PER_SECTION = 12;

function formatDate(value?: string | null) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function normalizeCredits(credits: MediaCredit[] | undefined) {
  if (!credits) {
    return [];
  }

  const seen = new Set<string>();

  return credits
    .filter((credit) => credit.media_type === 'movie' || credit.media_type === 'tv')
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .filter((credit) => {
      const mediaType = credit.media_type || (credit.title ? 'movie' : 'tv');
      const key = `${mediaType}-${credit.id}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, MAX_CREDITS_PER_SECTION)
    .map((credit) => ({
      ...credit,
      media_type: (credit.media_type || (credit.title ? 'movie' : 'tv')) as 'movie' | 'tv',
    }));
}

const PersonDetailPage: React.FC<PersonDetailPageProps> = ({ person }) => {
  const actingCredits = useMemo(
    () => normalizeCredits(person.combined_credits?.cast),
    [person.combined_credits?.cast]
  );
  const crewCredits = useMemo(
    () => normalizeCredits(person.combined_credits?.crew),
    [person.combined_credits?.crew]
  );

  const socialLinks = useMemo(() => {
    const ids = person.external_ids;

    return [
      ids?.instagram_id ? { label: 'Instagram', href: `https://instagram.com/${ids.instagram_id}` } : null,
      ids?.twitter_id ? { label: 'X', href: `https://x.com/${ids.twitter_id}` } : null,
      ids?.facebook_id ? { label: 'Facebook', href: `https://facebook.com/${ids.facebook_id}` } : null,
      ids?.youtube_id ? { label: 'YouTube', href: `https://youtube.com/${ids.youtube_id}` } : null,
      ids?.wikidata_id ? { label: 'Wikidata', href: `https://www.wikidata.org/wiki/${ids.wikidata_id}` } : null,
      person.external_ids?.imdb_id ? { label: 'IMDb', href: `https://www.imdb.com/name/${person.external_ids.imdb_id}` } : null,
    ].filter((item): item is { label: string; href: string } => item !== null);
  }, [person.external_ids]);

  const knownForCredits = actingCredits.length > 0 ? actingCredits : crewCredits;
  const galleryImages = person.images?.profiles?.slice(0, 6) || [];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground py-6">
      <div className="container mx-auto max-w-7xl px-4 lg:px-6 space-y-8">
        <div className="grid gap-6 lg:grid-cols-[220px,minmax(0,1fr)] lg:items-start">
          <div className="space-y-4 min-w-0 lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-card shadow-xl">
              {person.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${person.profile_path}`}
                  alt={person.name || 'Person'}
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center bg-secondary">
                  <UserRound className="h-14 w-14 text-foreground/40" />
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-card/80 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/55">Quick Facts</h2>
              <div className="mt-4 space-y-3 text-sm">
                <InfoRow icon={Clapperboard} label="Known For" value={person.known_for_department || 'N/A'} />
                <InfoRow icon={Calendar} label="Born" value={formatDate(person.birthday)} />
                <InfoRow icon={MapPin} label="Birthplace" value={person.place_of_birth || 'N/A'} />
                {person.deathday ? <InfoRow icon={Calendar} label="Died" value={formatDate(person.deathday)} /> : null}
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <div className="min-w-0 rounded-[2rem] border border-white/10 bg-card/70 p-5 sm:p-6 backdrop-blur-sm">
              <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3">
                  <p className="text-sm uppercase tracking-[0.25em] text-pink">Person</p>
                  <h1 className="break-words text-4xl font-semibold tracking-tight sm:text-5xl">{person.name}</h1>
                  {person.also_known_as?.length ? (
                    <p className="break-words text-sm text-foreground/60">
                      Also known as {person.also_known_as.slice(0, 3).join(', ')}
                    </p>
                  ) : null}
                </div>

                {socialLinks.length ? (
                  <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                    {socialLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 bg-secondary px-3 py-1.5 text-sm text-foreground/85 transition-colors hover:bg-secondary/80"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <MetricCard label="Known For" value={person.known_for_department || 'N/A'} />
                <MetricCard label="Acting Credits" value={String(person.combined_credits?.cast?.length || 0)} />
                <MetricCard label="Crew Credits" value={String(person.combined_credits?.crew?.length || 0)} />
              </div>
            </div>

            {knownForCredits.length ? (
              <section className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 p-5 sm:p-6 backdrop-blur-sm">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/55">Known For</h2>
                <p className="mt-2 text-sm text-foreground/60">The most recognizable titles from this person&apos;s screen work.</p>
                <div className="mt-4 min-w-0">
                  <SimilarContent
                    similar={knownForCredits as Media[]}
                    mediaType={knownForCredits[0].media_type as 'movie' | 'tv'}
                    title="On Screen"
                    subtitle="Popular titles from this person&apos;s filmography"
                  />
                </div>
              </section>
            ) : null}

            {crewCredits.length ? (
              <section className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 p-5 sm:p-6 backdrop-blur-sm">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/55">Crew Work</h2>
                <p className="mt-2 text-sm text-foreground/60">Projects they shaped behind the camera.</p>
                <div className="mt-4 min-w-0">
                  <SimilarContent
                    similar={crewCredits as Media[]}
                    mediaType={crewCredits[0].media_type as 'movie' | 'tv'}
                    title="Behind The Camera"
                    subtitle="Projects they helped shape in crew roles"
                  />
                </div>
              </section>
            ) : null}

            <div className="min-w-0 rounded-[2rem] border border-white/10 bg-card/70 p-5 sm:p-6 backdrop-blur-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/55">Biography</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-7 text-foreground/85">
                {person.biography || 'TMDB does not have a biography for this person yet.'}
              </p>
            </div>

            {galleryImages.length ? (
              <div className="min-w-0 rounded-[2rem] border border-white/10 bg-card/70 p-5 sm:p-6 backdrop-blur-sm">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/55">Gallery</h2>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {galleryImages.map((image) => (
                    <div key={image.file_path} className="overflow-hidden rounded-xl border border-white/10 bg-secondary">
                      <img
                        src={`https://image.tmdb.org/t/p/w300${image.file_path}`}
                        alt={person.name || 'Profile image'}
                        className="aspect-square w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
}> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="rounded-full bg-secondary p-2">
      <Icon className="h-4 w-4 text-foreground/70" />
    </div>
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-[0.18em] text-foreground/50">{label}</p>
      <p className="mt-1 text-sm text-foreground/85">{value}</p>
    </div>
  </div>
);

const MetricCard: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-secondary/70 p-4">
    <p className="text-xs uppercase tracking-[0.18em] text-foreground/50">{label}</p>
    <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-foreground">
      <Star className="h-4 w-4 text-pink" />
      {value}
    </p>
  </div>
);

export default PersonDetailPage;
