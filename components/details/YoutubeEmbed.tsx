// components/details/YoutubeEmbed.tsx
import React, { useEffect } from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  onClose: () => void;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ videoId, onClose }) => {
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []); 

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex flex-col" 
      onClick={onClose}
    >
      <div className="h-16 flex-shrink-0" aria-hidden="true"></div>

      <div className="flex-grow flex items-center justify-center p-4 overflow-auto">
        <div
          className="relative w-full max-w-[95vw] md:max-w-[80vw] bg-black rounded-3xl overflow-hidden shadow-xl aspect-video max-h-full" 
          onClick={(e) => e.stopPropagation()} 
        >
        <iframe
          className="absolute top-0 left-0 w-full h-full border-0"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} 
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy" 
        ></iframe>
        </div> 
      </div> 
    </div>
  );
};

export default YouTubeEmbed;