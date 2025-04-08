import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic'; 

async function resolveRedirect(redirectUrl: string, refererUrl: string): Promise<string | null> {
  try {
    const response = await fetch(redirectUrl, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': refererUrl,
      },
      signal: AbortSignal.timeout(8000)
    });

    if (response.status >= 300 && response.status < 400) {
      return response.headers.get('Location');
    }
    console.warn(`Redirect for ${redirectUrl} failed. Status: ${response.status}`);
    return null;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
          console.error(`Timeout resolving redirect: ${redirectUrl}`);
      } else {
          console.error(`Error resolving redirect ${redirectUrl}:`, error.message);
      }
    } else {
      console.error(`Unknown error resolving redirect ${redirectUrl}:`, error);
    }
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl || !targetUrl.startsWith('https://s.to/')) {
    return NextResponse.json({ error: 'Invalid or missing s.to URL parameter' }, { status: 400 });
  }

  const baseUrl = 'https://s.to';

  console.log(`Scraping s.to URL: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7', 
      },
       signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error(`Error fetching page ${targetUrl}: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: `Failed to fetch s.to page (Status: ${response.status})` }, { status: 502 }); 
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const hosterLinks: { hoster: string; redirectPath: string }[] = [];
    $('div.hosterSiteVideo ul li[data-lang-key="1"]').each((index, element) => {
      const linkElement = $(element).find('a.watchEpisode');
      const redirectPath = linkElement.attr('href');
      const hosterName = $(element).find('h4').text().trim();

      if (redirectPath && hosterName) {
        hosterLinks.push({ hoster: hosterName, redirectPath: redirectPath });
      }
    });

    if (hosterLinks.length === 0) {
      console.warn(`No German hoster links found on ${targetUrl}`);
      return NextResponse.json({ links: [] });
    }

    console.log(`Found ${hosterLinks.length} potential German hoster links.`);

    const resolvedLinksPromises = hosterLinks.map(async (link) => {
      const finalUrl = await resolveRedirect(baseUrl + link.redirectPath, targetUrl);
      return finalUrl ? { hoster: link.hoster, url: finalUrl } : null;
    });

    const resolvedLinks = (await Promise.all(resolvedLinksPromises)).filter(link => link !== null);

    console.log(`Successfully resolved ${resolvedLinks.length} links for ${targetUrl}`);

    return NextResponse.json({ links: resolvedLinks });

  } catch (error: unknown) { 
     if (error instanceof Error) {
       if (error.name === 'TimeoutError') {
          console.error(`Timeout fetching main page: ${targetUrl}`);
           return NextResponse.json({ error: 'Timeout fetching s.to page' }, { status: 504 });
      } else {
          console.error(`Error during scraping process for ${targetUrl}:`, error.message);
          return NextResponse.json({ error: 'Internal server error during scraping' }, { status: 500 });
      }
    } else {
       console.error(`Unknown error during scraping process for ${targetUrl}:`, error);
       return NextResponse.json({ error: 'Internal server error during scraping' }, { status: 500 });
    }
  }
}
