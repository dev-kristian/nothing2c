// lib/swr-config.ts
import { Fetcher } from 'swr';

// Define a default fetcher.  This handles converting the response to JSON.
const defaultFetcher: Fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    // This throws an error that SWR can catch, providing more context.
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    (error as any).info = await res.json();
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};


const swrConfig = {
  fetcher: defaultFetcher,
  revalidateOnFocus: false,  // Disable revalidation on window focus (optional, adjust as needed)
  revalidateOnReconnect: true, // Revalidate when the network connection is restored
  errorRetryCount: 3,         // Retry failed requests up to 3 times
  dedupingInterval: 2000, // Prevent duplicate requests for the same key within 2 seconds, very important to avoid duplicate requests.
};

export default swrConfig;