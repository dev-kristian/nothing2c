'use client';

import React, { useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

export function WithAuth<T extends object>(Component: React.ComponentType<T>) {
  return function WrappedComponent(props: T) {
    const { user, loading, initialAuthChecked } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
      // Only redirect if initial check is done, not loading, and no user exists.
      if (initialAuthChecked && !loading && !user) {
        router.push('/sign-in');
      }
    }, [user, loading, initialAuthChecked, router]); // Dependencies ensure effect runs when these values change

    // Show loading indicator during initial auth check or if redirecting
    if (!initialAuthChecked || (!loading && !user)) {
      return <Loading message="Authenticating..." spinnerType="full" />;
    }

    // Render the wrapped component if authenticated
    return <Component {...props} />;
  };
}
