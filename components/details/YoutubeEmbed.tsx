// components/YouTubeEmbed.tsx
import React from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  onClose: () => void;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ videoId, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="relative w-full h-full max-w-[95vw] max-h-[95vh] md:max-w-[80vw] md:max-h-[80vh] rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors duration-300 z-10"
          onClick={onClose}
        >
          ×
        </button>
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default YouTubeEmbed;