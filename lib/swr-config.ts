import { Fetcher } from 'swr';

export const fetcher: Fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    (error as Error & { info: unknown; status: number }).info = await res.json();
    (error as Error & { info: unknown; status: number }).status = res.status;
    throw error;
  }
  return res.json();
};

export const defaultSWRConfig = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  errorRetryCount: 3,
  dedupingInterval: 2000,
};

export default defaultSWRConfig;
