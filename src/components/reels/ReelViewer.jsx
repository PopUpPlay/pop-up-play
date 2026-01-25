import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ReelViewer({ reel, profile, isActive, onToggleMute, isMuted, reelIndex }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewCounted, setViewCounted] = useState(false);
  const [views, setViews] = useState(reel?.views || 0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  // Update progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('durationchange', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('durationchange', updateDuration);
    };
  }, []);

  const handleVideoClick = () => {
    if (!videoRef.current || isDragging) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e, element) => {
    if (!videoRef.current || !duration) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = element.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const time = pos * duration;
    
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    handleSeek(e, e.currentTarget);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const progressBar = document.querySelector('.progress-bar-container');
    if (progressBar) {
      handleSeek(e, progressBar);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => handleMouseMove(e);
      const handleEnd = () => handleMouseUp();
      
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove);
      document.addEventListener('touchend', handleEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, duration]);

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
      
      {/* Video Click Area (behind progress bar) */}
      <div 
        className="absolute inset-0 cursor-pointer"
        style={{ zIndex: 1 }}
        onClick={handleVideoClick} />

      {/* Progress Bar */}
      <div className="absolute bottom-20 left-0 right-0 px-4" style={{ zIndex: 10 }}>
        <div 
          className="progress-bar-container relative h-3 -my-1 cursor-pointer group"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}>
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-white/30 rounded-full" />
          <div 
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-white rounded-full"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-opacity"
            style={{ 
              left: `${duration ? (currentTime / duration) * 100 : 0}%`, 
              transform: 'translate(-50%, -50%)',
              opacity: isDragging ? 1 : 0
            }} />
        </div>
      </div>

      {/* Overlay - User Info & Caption */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent" style={{ zIndex: 5 }}>
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