import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Video, Loader2, Play, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function VideoGallery({ videos = [], onVideosChange, editable = true }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pushingToReels, setPushingToReels] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }

    // Validate file size (200MB limit)
    const maxSize = 200 * 1024 * 1024; // 200MB in bytes
    if (file.size > maxSize) {
      toast.error('Video size must be less than 200MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      onVideosChange([...videos, file_url]);
      toast.success('Video uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload video. Please try again.');
      setUploadProgress(0);
    }
    
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 500);
  };

  const handleRemove = (index) => {
    const newVideos = videos.filter((_, i) => i !== index);
    onVideosChange(newVideos);
  };

  const handlePushToReels = async (videoUrl, index) => {
    setPushingToReels(index);
    try {
      const user = await base44.auth.me();
      
      // Get video duration
      const video = document.createElement('video');
      video.src = videoUrl;
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      const duration = Math.round(video.duration);

      // Create reel
      await base44.entities.Reel.create({
        user_email: user.email,
        video_url: videoUrl,
        duration
      });

      toast.success('Video pushed to Reels feed!');
    } catch (error) {
      toast.error('Failed to push to Reels: ' + error.message);
    } finally {
      setPushingToReels(null);
    }
  };

  return (
    <div>
      {editable && (
        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-700 mb-1">Video Requirements:</p>
          <ul className="text-xs text-slate-600 space-y-0.5">
            <li>• Max size: 200MB per video</li>
            <li>• Formats: MP4, MOV, AVI, WebM</li>
            <li>• Recommended: 1080p or lower</li>
            <li>• Maximum: 4 videos total</li>
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {videos.map((video, index) => (
          <motion.div
            key={index}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-video rounded-xl overflow-hidden group bg-slate-900"
          >
            <video 
              src={video}
              className="w-full h-full object-cover"
              controls
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
            />
            {editable && (
              <>
                <button
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <Button
                  onClick={() => handlePushToReels(video, index)}
                  disabled={pushingToReels === index}
                  size="sm"
                  className="absolute bottom-2 right-2 bg-violet-600 hover:bg-violet-700 text-white gap-1 z-10"
                >
                  {pushingToReels === index ? (
                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                  ) : (
                    <>
                      <Send className="w-3 h-3 text-white" />
                      <span className="text-xs text-white">Push to Reels</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </motion.div>
        ))}
        
        {editable && videos.length < 4 && (
          <label className="aspect-video rounded-xl border-2 border-dashed border-rose-200 hover:border-rose-400 flex flex-col items-center justify-center cursor-pointer transition-colors bg-rose-50/50 hover:bg-rose-50 min-h-[200px]">
            <input
              type="file"
              accept="video/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
                <div className="w-32 h-2 bg-rose-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs text-rose-600 font-medium">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
            ) : (
              <>
                <Video className="w-8 h-8 text-rose-400 mb-1" />
                <span className="text-xs text-rose-500">Add Video</span>
                <span className="text-xs text-rose-400 mt-1">Max 200MB</span>
              </>
            )}
          </label>
        )}
      </div>
    </div>
  );
}