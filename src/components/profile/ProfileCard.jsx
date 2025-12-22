import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MapPin, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ProfileCard({ profile, onLike, onClose, isLiking }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = profile.photos || [profile.avatar_url];

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Photo Gallery */}
        <div className="relative aspect-[3/4] bg-slate-100">
          <img
            src={photos[currentPhotoIndex] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600'}
            alt={profile.display_name}
            className="w-full h-full object-cover"
          />
          
          {/* Photo navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
              >
                ‹
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
              >
                ›
              </button>
              
              {/* Photo indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                {photos.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      index === currentPhotoIndex 
                        ? "bg-white w-4" 
                        : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                {profile.display_name}
                {profile.age && <span className="text-slate-500">, {profile.age}</span>}
              </h2>
              {profile.current_city && (
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{profile.current_city}</span>
                </div>
              )}
            </div>
            
            {profile.is_popped_up && (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-green-700">Active</span>
              </div>
            )}
          </div>

          {profile.popup_message && (
            <div className="mb-4 p-4 bg-gradient-to-r from-violet-50 to-rose-50 rounded-xl border border-violet-100">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 italic">"{profile.popup_message}"</p>
              </div>
            </div>
          )}

          {profile.bio && (
            <div className="mb-4">
              <p className="text-slate-600 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Interests Tags */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span key={index} className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hobbies */}
          {profile.hobbies && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Hobbies</h3>
              <p className="text-sm text-slate-600">{profile.hobbies}</p>
            </div>
          )}

          {/* Looking For */}
          {profile.looking_for && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Looking For</h3>
              <p className="text-sm text-slate-600">{profile.looking_for}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="flex flex-wrap gap-2 mb-6">
            {profile.gender && (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                {profile.gender}
              </span>
            )}
            {profile.interested_in && (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                Interested in {profile.interested_in}
              </span>
            )}
            {profile.photos?.length > 0 && (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {profile.photos.length} photos
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full border-2 h-14 text-base"
            >
              <X className="w-5 h-5 mr-2" />
              Close
            </Button>
            <Button
              onClick={() => onLike(profile)}
              disabled={isLiking}
              className="flex-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 h-14 text-base"
            >
              <Heart className="w-5 h-5 mr-2" />
              Like
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}