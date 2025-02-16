// components/HostEmbed.tsx
'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VIDSRC_DOMAINS = [
  'vidsrc.in',
  'vidsrc.pm',
  'vidsrc.xyz',
  'vidsrc.net'
];

const SERVER_OPTIONS = [
  {
    id: 'vidsrc',
    name: 'VidSrc',
    domains: VIDSRC_DOMAINS,
    currentDomain: VIDSRC_DOMAINS[0],
  },
  {
    id: 'nexa',
    name: 'Nexa',
    url: 'https://v1.shaaringaton.host/nexa/',
  },
  {
    id: 'multi',
    name: 'Multi',
    url: 'https://v2.shaaringaton.host/multi/',
  },
  {
    id: 'shukra',
    name: 'Shukra',
    url: 'https://v3.shaaringaton.host/shukra/',
  },
  {
    id: 'desi',
    name: 'Desi',
    url: 'https://v4.shaaringaton.host/desi/',
  },
  {
    id: 'vietflick',
    name: 'VietFlick',
    url: 'https://v5.shaaringaton.host/vietflick/',
  },
  {
    id: 'budh',
    name: 'Budh',
    url: 'https://v6.shaaringaton.host/budh/',
  },
  {
    id: 'oyo',
    name: 'OYO',
    url: 'https://v7.shaaringaton.host/oyo/',
  }
];

interface HostEmbedProps {
  tmdbId: number;
  seasonNumber?: number;
  episodeNumber?: number;
  onClose: () => void;
  // Add these new props
  totalEpisodes?: number;
  onNavigateEpisode?: (direction: 'next' | 'prev') => void;
}

// Inside the component, add navigation buttons
const HostEmbed: React.FC<HostEmbedProps> = ({ 
  tmdbId, 
  seasonNumber, 
  episodeNumber,
  onClose,
  totalEpisodes,
  onNavigateEpisode 
}) => {
  const [selectedServer, setSelectedServer] = useState(SERVER_OPTIONS[0]);
  const [currentVidSrcDomain, setCurrentVidSrcDomain] = useState(VIDSRC_DOMAINS[0]);
  const [isServerListOpen, setIsServerListOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState('');

  const generateEmbedUrl = useCallback(() => {
    if (selectedServer.id === 'vidsrc') {
      const baseUrl = `https://${currentVidSrcDomain}/embed/`;
      if (seasonNumber && episodeNumber) {
        return `${baseUrl}tv?tmdb=${tmdbId}&season=${seasonNumber}&episode=${episodeNumber}`;
      }
      return `${baseUrl}movie?tmdb=${tmdbId}`;
    }
    
    // For other servers
    if (seasonNumber && episodeNumber) {
      return `${selectedServer.url}?id=${tmdbId}&season=${seasonNumber}&episode=${episodeNumber}`;
    }
    return `${selectedServer.url}?id=${tmdbId}`;
  }, [tmdbId, seasonNumber, episodeNumber, selectedServer, currentVidSrcDomain]);

  useEffect(() => {
    setEmbedUrl(generateEmbedUrl());
    setIsLoading(true);
  }, [generateEmbedUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative w-full h-[90vh] bg-gray-950/70 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        <div className="relative z-20 p-2">
          <div className="flex flex-col space-y-1">
            {/* Top Controls Bar */}
            <div className="flex items-center justify-between space-x-1">
              {/* Left Side - Server Selection */}
              <div className="relative flex-1">
                <button 
                  onClick={() => setIsServerListOpen(!isServerListOpen)}
                  className="w-full bg-white/10 hover:bg-white/20 rounded-lg p-2 flex items-center justify-between"
                >
                  <span className="font-medium text-white">{selectedServer.name}</span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
  
                <AnimatePresence>
                  {isServerListOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-xl overflow-hidden z-50"
                    >
                      {SERVER_OPTIONS.map((server) => (
                        <button
                          key={server.id}
                          onClick={() => {
                            setSelectedServer(server);
                            setIsServerListOpen(false);
                          }}
                          className={`w-full p-3 text-left hover:bg-gray-800/50 transition-colors
                            ${selectedServer.id === server.id ? 'bg-gray-800/30' : ''}`}
                        >
                          <span className="text-white">{server.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
  
              {/* Center - Episode Navigation */}
              {seasonNumber && episodeNumber && onNavigateEpisode && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onNavigateEpisode('prev')}
                    disabled={episodeNumber === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      episodeNumber === 1 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
  
                  <span className="text-sm text-gray-400">
                    Episode {episodeNumber}{totalEpisodes ? ` / ${totalEpisodes}` : ''}
                  </span>
  
                  <button
                    onClick={() => onNavigateEpisode('next')}
                    disabled={totalEpisodes ? episodeNumber === totalEpisodes : false}
                    className={`p-2 rounded-lg transition-colors ${
                      totalEpisodes && episodeNumber === totalEpisodes
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
  
              {/* Right Side - Close Button */}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
  
           {/* VidSrc Domain Selection - Improved Version */}
            {selectedServer.id === 'vidsrc' && (
              <div className="relative">
                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Current Server:</span>
                    <span className="text-sm font-medium text-white">{currentVidSrcDomain}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {/* Previous Domain Button */}
                    <button
                      onClick={() => {
                        const currentIndex = VIDSRC_DOMAINS.indexOf(currentVidSrcDomain);
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : VIDSRC_DOMAINS.length - 1;
                        setCurrentVidSrcDomain(VIDSRC_DOMAINS[prevIndex]);
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Domain Status Indicators */}
                    <div className="hidden sm:flex items-center space-x-1 px-2">
                      {VIDSRC_DOMAINS.map((domain) => (
                        <button
                          key={domain}
                          onClick={() => setCurrentVidSrcDomain(domain)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            currentVidSrcDomain === domain
                              ? 'bg-blue-500 w-4'
                              : 'bg-gray-600 hover:bg-gray-500'
                          }`}
                          title={domain}
                        />
                      ))}
                    </div>

                    {/* Next Domain Button */}
                    <button
                      onClick={() => {
                        const currentIndex = VIDSRC_DOMAINS.indexOf(currentVidSrcDomain);
                        const nextIndex = currentIndex < VIDSRC_DOMAINS.length - 1 ? currentIndex + 1 : 0;
                        setCurrentVidSrcDomain(VIDSRC_DOMAINS[nextIndex]);
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Quick Switch Menu Button */}
                    <button
                      onClick={() => setIsServerListOpen(!isServerListOpen)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-1"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Quick Switch Menu */}
                <AnimatePresence>
                  {isServerListOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-xl overflow-hidden z-50"
                    >
                      {VIDSRC_DOMAINS.map((domain) => (
                        <button
                          key={domain}
                          onClick={() => {
                            setCurrentVidSrcDomain(domain);
                            setIsServerListOpen(false);
                          }}
                          className={`w-full p-2.5 text-left hover:bg-gray-800/50 transition-colors flex items-center justify-between
                            ${currentVidSrcDomain === domain ? 'bg-gray-800/30' : ''}`}
                        >
                          <span className="text-sm text-white">{domain}</span>
                          {currentVidSrcDomain === domain && (
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

          </div>
        </div>
  
        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center bg-black/50 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-white"></div>
            </motion.div>
          )}
        </AnimatePresence>
  
        {/* Embed Iframe */}
        <div 
          className={`flex-grow relative transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        >
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            allowFullScreen
            onLoad={handleIframeLoad}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="origin"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default HostEmbed;