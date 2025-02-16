// C:\Users\Vivobook\Documents\dev-kristian\kinonchill\app\(root)\details\[type]\[id]\page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import CrewCarousel from '@/components/details/CrewCarousel';
import { DetailsData, VideoData } from '@/types';
import DetailPageWrapper from '@/components/details/DetailPageWrapper';
import SeasonCarousel from '@/components/details/SeasonCarousel';

interface DetailPageProps {
  params: {
    type: string;
    id: string;
  };
}

async function getDetails(type: string, id: string): Promise<DetailsData> {
  const bearerToken = process.env.NEXT_PRIVATE_TMDB_API_KEY;
  const detailsUrl = `https://api.themoviedb.org/3/${type}/${id}?language=en-US&append_to_response=external_ids`;
  const contentRatingsUrl = `https://api.themoviedb.org/3/${type}/${id}/content_ratings`;
  const creditsUrl = `https://api.themoviedb.org/3/${type}/${id}/credits`;

  const [detailsResponse, contentRatingsResponse, creditsResponse] = await Promise.all([
    fetch(detailsUrl, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'accept': 'application/json'
      },
      next: { revalidate: 3600 }
    }),
    type === 'tv' ? fetch(contentRatingsUrl, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'accept': 'application/json'
      },
      next: { revalidate: 3600 }
    }) : null,
    fetch(creditsUrl, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'accept': 'application/json'
      },
      next: { revalidate: 3600 }
    })
  ]);

  if (!detailsResponse.ok || !creditsResponse.ok) {
    throw new Error(`Failed to fetch details: ${detailsResponse.status}`);
  }

  const detailsData = await detailsResponse.json();
  const creditsData = await creditsResponse.json();
  let contentRating = null;

  if (contentRatingsResponse) {
    const contentRatingsData = await contentRatingsResponse.json();
    const usRating = contentRatingsData.results.find((rating: { iso_3166_1: string }) => rating.iso_3166_1 === 'US');
    contentRating = usRating ? usRating.rating : null;
  }

  return { ...detailsData, contentRating, credits: creditsData };
}

async function getVideos(type: string, id: string): Promise<VideoData[]> {
  const bearerToken = process.env.NEXT_PRIVATE_TMDB_API_KEY;
  const videosUrl = `https://api.themoviedb.org/3/${type}/${id}/videos`;

  const response = await fetch(videosUrl, {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'accept': 'application/json'
    },
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch videos: ${response.status}`);
  }

  const data = await response.json();
  return data.results;
}

async function getSeasonDetails(type: string, id: string, seasonNumber: number) {
  const bearerToken = process.env.NEXT_PRIVATE_TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/${type}/${id}/season/${seasonNumber}?language=en-US`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
      'accept': 'application/json'
    },
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch season details: ${response.status}`);
  }

  return await response.json();
}

export default async function DetailPage({ params }: DetailPageProps) {
  let details: DetailsData;
  let videos: VideoData[];

  try {
    [details, videos] = await Promise.all([
      getDetails(params.type, params.id),
      getVideos(params.type, params.id)
    ]);
  } catch (error) {
    console.error('Error fetching details:', error);
    notFound();
  }

  // Server Action for fetching season details
  async function fetchSeasonDetails(formData: FormData) {
    'use server'
    const seasonNumber = Number(formData.get('seasonNumber'));
    try {
      return await getSeasonDetails(params.type, params.id, seasonNumber);
    } catch (error) {
      console.error('Error fetching season details:', error);
      return null;
    }
  }

  return (
    <div >
      <DetailPageWrapper
        details={details}
        videos={videos}
      />
      
      <div className="pt-4 w-full px-2 md:px-8">
        {params.type === 'tv' && details.seasons && (
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
      </div>
    </div>
  );
}