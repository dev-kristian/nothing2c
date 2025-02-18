'use client';

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

export function WithAuth<T extends object>(Component: React.ComponentType<T>) {
  return function WrappedComponent(props: T) {
    const { user, loading, initialAuthChecked } = useAuthContext();
    const router = useRouter();

    // Show loading screen until initial auth check is complete.
    if (!initialAuthChecked) {
        return <Loading message="Authenticating..." spinnerType="full" />;
    }

    // If not authenticated, redirect to login (adjust path as needed).
    if (!loading && !user) {
       router.push('/login'); // Or any other appropriate route
       return null; // Prevent rendering further down
    }


    // If authenticated, render the wrapped component.
    return <Component {...props} />;
  };
}