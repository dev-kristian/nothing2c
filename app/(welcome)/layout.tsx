// app/(welcome)/layout.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { getUserProfileStatus } from '@/lib/server-auth-utils';
import Image from 'next/image';
  
export default async function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profileStatus = await getUserProfileStatus();

  if (!profileStatus) {
    console.log('[Welcome Layout] User not authenticated, redirecting to /sign-in');
    redirect('/sign-in');
  }

  if (profileStatus.setupCompleted) {
    console.log('[Welcome Layout] Profile already complete, redirecting to /');
    redirect('/');
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-2`}>
      <div className="max-w-xl w-full bg-white/60 dark:bg-[#1c1c1e]/80 backdrop-blur-[30px] backdrop-saturate-[180%] rounded-2xl overflow-hidden border border-white/30 dark:border-white/10 relative shadow-apple dark:shadow-apple-dark">
        <div className="relative z-10 p-8"> 
          <div className="flex justify-center items-center space-x-3 mb-6"> 
            <div className="relative">
              <Image
                src="/icons/popcorn.png"
                alt=""
                width={46} 
                height={46}
                className="drop-shadow-lg filter"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-xl font-bold tracking-tight relative text-pink">
                  <span>Nothing</span>
                  <sup className="absolute -right-5 text-xs font-bold text-pink">2C</sup>
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase -mt-0.5 ml-0.5">
                Entertainment
              </span>
             </div>
           </div>
           {/* Render children directly */}
           {children}
         </div>
       </div>
       {/* Removed Toaster instance */}
     </div>
   );
 }
