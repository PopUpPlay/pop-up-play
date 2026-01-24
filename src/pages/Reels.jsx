import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReelViewer from '@/components/reels/ReelViewer';
import ReelUpload from '@/components/reels/ReelUpload';

export default function Reels() {
  const [user, setUser] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: reels = [], isLoading } = useQuery({
    queryKey: ['reels'],
    queryFn: async () => {
      const allReels = await base44.entities.Reel.list('-created_date');
      return allReels;
    },
    refetchInterval: 30000
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['reelProfiles', reels],
    queryFn: async () => {
      if (reels.length === 0) return [];
      const userEmails = [...new Set(reels.map(r => r.user_email))];
      const allProfiles = await base44.entities.UserProfile.filter({});
      return allProfiles.filter(p => userEmails.includes(p.user_email));
    },
    enabled: reels.length > 0
  });

  const getProfileForReel = (reel) => {
    return profiles.find(p => p.user_email === reel.user_email);
  };

  // Handle swipe navigation
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swipe up - next reel
      handleNextReel();
    } else if (distance < -minSwipeDistance) {
      // Swipe down - previous reel
      handlePreviousReel();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Handle wheel navigation (desktop)
  const handleWheel = (e) => {
    e.preventDefault();
    
    if (e.deltaY > 0) {
      handleNextReel();
    } else if (e.deltaY < 0) {
      handlePreviousReel();
    }
  };

  const handleNextReel = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePreviousReel = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextReel();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePreviousReel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reels.length]);

  const handleUploadComplete = () => {
    setShowUpload(false);
    queryClient.invalidateQueries({ queryKey: ['reels'] });
  };

  if (!user || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 left-4 z-50">
          <Link to={createPageUrl('Menu')}>
            <Button variant="ghost" size="icon" className="rounded-full bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <Plus className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">No Reels Yet</h2>
          <p className="text-white/70 mb-6">Be the first to share a reel!</p>
          <Button
            onClick={() => setShowUpload(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="w-5 h-5 mr-2 text-white" />
            Upload Reel
          </Button>
        </div>

        <AnimatePresence>
          {showUpload && (
            <ReelUpload
              onUploadComplete={handleUploadComplete}
              onClose={() => setShowUpload(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full bg-black overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}>
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <Link to={createPageUrl('Menu')}>
            <Button variant="ghost" size="icon" className="rounded-full bg-white/20 hover:bg-white/30 text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-white font-bold text-lg">Reels</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Reels Container */}
      <div className="h-full w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="absolute inset-0">
            <ReelViewer
              reel={reels[currentIndex]}
              profile={getProfileForReel(reels[currentIndex])}
              isActive={true}
              onToggleMute={() => setIsMuted(!isMuted)}
              isMuted={isMuted} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Upload Button */}
      <motion.div
        className="absolute bottom-24 right-6 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}>
        <Button
          onClick={() => setShowUpload(true)}
          className="rounded-full w-14 h-14 bg-violet-600 hover:bg-violet-700 shadow-2xl">
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Progress Indicator */}
      <div className="absolute top-20 right-4 z-50">
        <div className="text-white/70 text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
          {currentIndex + 1} / {reels.length}
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <ReelUpload
            onUploadComplete={handleUploadComplete}
            onClose={() => setShowUpload(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}