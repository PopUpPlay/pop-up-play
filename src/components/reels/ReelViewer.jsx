import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreVertical, Volume2, VolumeX, RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ReelViewer({ reel, profile, isActive, onToggleMute, isMuted, reelIndex }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewCounted, setViewCounted] = useState(false);
  const [views, setViews] = useState(reel?.views || 0);
  const [showSkipIndicator, setShowSkipIndicator] = useState(null);

  // Increment view count when reel becomes active
  useEffect(() => {
    if (isActive && !viewCounted && reel?.id) {
      const incrementView = async () => {
        try {
          const { base44 } = await import('@/api/base44Client');
          await base44.entities.Reel.update(reel.id, { views: (reel.views || 0) + 1 });
          setViews((reel.views || 0) + 1);
          setViewCounted(true);
        } catch (error) {
          // Silently fail
        }
      };
      incrementView();
    }
  }, [isActive, reel?.id, viewCounted]);

  // Reset view count when reel changes
  useEffect(() => {
    setViewCounted(false);
    setViews(reel?.views || 0);
  }, [reel?.id]);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleVideoClick = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  if (!reel) {
    return <div className="relative w-full h-full bg-black" />;
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video_url}
        className="w-full h-full object-contain"
        loop
        playsInline
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        onEnded={() => setIsPlaying(false)} />

      {/* Invisible tap zones */}
      <div className="absolute inset-0 flex">
        {/* Left zone - rewind */}
        <div 
          className="w-[30%] h-full cursor-pointer"
          onClick={() => handleSkip(-10)}
        />
        {/* Center zone - play/pause */}
        <div 
          className="flex-1 h-full cursor-pointer"
          onClick={handleVideoClick}
        />
        {/* Right zone - fast forward */}
        <div 
          className="w-[30%] h-full cursor-pointer"
          onClick={() => handleSkip(10)}
        />
      </div>

      {/* Skip indicators */}
      <AnimatePresence>
        {showSkipIndicator === 'backward' && (
          <motion.div
            className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}>
            <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <RotateCcw className="w-8 h-8 text-white" />
            </div>
          </motion.div>
        )}
        {showSkipIndicator === 'forward' && (
          <motion.div
            className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}>
            <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <RotateCw className="w-8 h-8 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay - User Info & Caption */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <Link to={createPageUrl('Profile') + '?user=' + reel.user_email + '&back=Reels&reelIndex=' + reelIndex}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
              <img
                src={profile?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'}
                alt="Profile"
                className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-semibold">
                {profile?.display_name || 'Unknown User'}
              </p>
              <p className="text-white/70 text-sm">
                {profile?.current_city}, {profile?.current_state}
              </p>
            </div>
          </div>
        </Link>

        {reel.caption && (
          <p className="text-white text-sm mb-2">{reel.caption}</p>
        )}
        
        <p className="text-white/70 text-xs">{views} {views === 1 ? 'view' : 'views'}</p>
      </div>



      {/* Play/Pause Indicator */}
      {!isPlaying && isActive && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}>
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
          </div>
        </motion.div>
      )}
    </div>
  );
}