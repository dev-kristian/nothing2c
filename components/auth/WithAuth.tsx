'use client';

import React from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

export function WithAuth<T extends object>(Component: React.ComponentType<T>) {
  return function WrappedComponent(props: T) {
    const { user, loading, initialAuthChecked } = useAuthContext();
    const router = useRouter();

    if (!initialAuthChecked) {
        return <Loading message="Authenticating..." spinnerType="full" />;
    }

    if (!loading && !user) {
       router.push('/sign-in');
       return null;
    }

    return <Component {...props} />;
  };
}