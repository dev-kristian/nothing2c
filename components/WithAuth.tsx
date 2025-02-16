// components/WithAuth.tsx
'use client';

import { useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Loading from '@/components/Loading';

export function WithAuth<T extends object>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const { user, loading } = useAuthContext();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      const checkUserSetup = async () => {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          if (!userData?.setupCompleted && pathname !== '/welcome') {
            router.push('/welcome');
          } else if (userData?.setupCompleted && pathname === '/welcome') {
            router.push('/');
          }
        } else if (!loading && pathname !== '/sign-in') {
          router.push('/sign-in');
        }
      };

      if (!loading) {
        checkUserSetup();
      }
    }, [user, loading, router, pathname]);

    if (loading) {
      return <Loading message="Loading..." spinnerType="full" />;
    }

    if (!user && pathname !== '/sign-in') {
      return null;
    }

    return <Component {...props} />;
  };
}
