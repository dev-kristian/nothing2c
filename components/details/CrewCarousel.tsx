// CrewCarousel.tsx
'use client'
import React, { useMemo, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Image from 'next/image';
import Spinner from '../Spinner';
import { CrewMember } from '@/types';

interface CrewCarouselProps {
  cast: CrewMember[];
  crew: CrewMember[];
  isLoading: boolean;
  error: string | null;
}

const CrewCarousel: React.FC<CrewCarouselProps> = ({ cast, crew, isLoading, error }) => {
  const controls = useAnimation();

  const mergedCrewMembers = useMemo(() => {
    const memberMap = new Map<number, CrewMember>();

    const addMember = (member: CrewMember, role: string) => {
      if (memberMap.has(member.id)) {
        memberMap.get(member.id)!.roles.push(role);
      } else {
        memberMap.set(member.id, { ...member, roles: [role] });
      }
    };

    cast.forEach(member => addMember(member, member.character || 'Cast'));
    crew.forEach(member => addMember(member, member.job || 'Crew'));

    return Array.from(memberMap.values());
  }, [cast, crew]);

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
  }, [controls]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 50 }}
      animate={controls}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-bold text-start bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
        Full Cast &amp; Crew
      </h2>
      <div className="overflow-x-auto py-4 md:px-2">
        <div className="flex space-x-4">
          {mergedCrewMembers.map((crewMember) => (
            <motion.div 
              key={crewMember.id} 
              className="flex-none w-40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md">
                {crewMember.profile_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w300${crewMember.profile_path}`}
                    alt={crewMember.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No Image</span>
                  </div>
                )}
              </div>
              <h3 className="mt-2 text-sm font-semibold">{crewMember.name}</h3>
              <p className="text-xs text-gray-400">{crewMember.roles.join(', ')}</p>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex-none w-40 flex justify-center items-center">
              <Spinner />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CrewCarousel;