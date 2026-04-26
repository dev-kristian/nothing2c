import React from 'react';
import { notFound } from 'next/navigation';
import CrewCarousel from '@/components/details/CrewCarousel';
import {
  DetailsData,
  PersonDetails,
  Review,
  SeasonDetails,
} from '@/types';
import DetailPageWrapper from '@/components/details/DetailPageWrapper';
import PersonDetailPage from '@/components/details/PersonDetailPage';
import SeasonCarousel from '@/components/details/SeasonCarousel';
import ReviewsSection from '@/components/details/ReviewsSection';
import SimilarContent from '@/components/details/SimilarContent';
import { tmdbFetch } from '@/lib/tmdb';

interface DetailPageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

function getMovieCertification(details: DetailsData) {
  const usRelease = details.release_dates?.results?.find((result) => result.iso_3166_1 === 'US');
  const certificationWithValue = usRelease?.release_dates?.find((entry) => Boolean(entry.certification));
  return certificationWithValue?.certification || null;
}

function getTvCertification(details: DetailsData) {
  const usRating = details.content_ratings?.results?.find((entry) => entry.iso_3166_1 === 'US');
  return usRating?.rating || null;
}

async function getMediaDetails(type: 'movie' | 'tv', id: string): Promise<DetailsData> {
  const appendToResponse = [
    'credits',
    'external_ids',
    'videos',
    'reviews',
    'recommendations',
    'similar',
    'watch/providers',
    type === 'movie' ? 'release_dates' : 'content_ratings',
  ].join(',');

  const details = await tmdbFetch<DetailsData>(`/${type}/${id}`, {
    params: {
      language: 'en-US',
      append_to_response: appendToResponse,
    },
  });

  return {
    ...details,
    contentRating: type === 'movie' ? getMovieCertification(details) : getTvCertification(details),
  };
}

async function getPersonDetails(id: string): Promise<PersonDetails> {
  return tmdbFetch<PersonDetails>(`/person/${id}`, {
    params: {
      language: 'en-US',
      append_to_response: 'combined_credits,images,external_ids',
      include_image_language: 'en,null',
    },
  });
}

async function getSeasonDetails(id: string, seasonNumber: number): Promise<SeasonDetails> {
  return tmdbFetch<SeasonDetails>(`/tv/${id}/season/${seasonNumber}`, {
    params: {
      language: 'en-US',
    },
  });
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { type, id } = await params;

  if (type === 'person') {
    let person: PersonDetails;

    try {
      person = await getPersonDetails(id);
    } catch (error) {
      console.error('Error fetching person details:', error);
      notFound();
    }

    return <PersonDetailPage person={person} />;
  }

  if (type !== 'movie' && type !== 'tv') {
    notFound();
  }

  let details: DetailsData;

  try {
    details = await getMediaDetails(type, id);
  } catch (error) {
    console.error('Error fetching media details:', error);
    notFound();
  }

  async function fetchSeasonDetails(formData: FormData) {
    'use server';

    const seasonNumber = Number(formData.get('seasonNumber'));

    try {
      return await getSeasonDetails(id, seasonNumber);
    } catch (error) {
      console.error('Error fetching season details:', error);
      return null;
    }
  }

  const reviews: Review[] = details.reviews?.results || [];
  const recommendations = details.recommendations?.results || [];
  const videos = details.videos?.results || [];

  return (
    <div>
      <DetailPageWrapper details={details} videos={videos} />
      <div className="pt-4 w-full px-2 md:px-8">
        {type === 'tv' && details.seasons && (
          <SeasonCarousel
            seasons={details.seasons}
            tmdbId={details.id}
            fetchSeasonDetails={fetchSeasonDetails}
          />
        )}
        <CrewCarousel
          cast={details.credits.cast}
          crew={details.credits.crew}
          isLoading={false}
          error={null}
        />
        <ReviewsSection reviews={reviews} />
        <SimilarContent
          similar={recommendations}
          mediaType={type}
          title="Recommended For You"
          subtitle={`TMDB recommendations based on this ${type === 'movie' ? 'movie' : 'series'}`}
        />
      </div>
    </div>
  );
}
