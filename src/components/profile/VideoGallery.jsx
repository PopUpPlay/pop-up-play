import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Video, Loader2, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VideoGallery({ videos = [], onVideosChange, editable = true }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onVideosChange([...videos, file_url]);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handleRemove = (index) => {
    const newVideos = videos.filter((_, i) => i !== index);
    onVideosChange(newVideos);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
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
            />
            {editable && (
              <button
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </motion.div>
        ))}
        
        {editable && videos.length < 4 && (
          <label className="aspect-video rounded-xl border-2 border-dashed border-rose-200 hover:border-rose-400 flex flex-col items-center justify-center cursor-pointer transition-colors bg-rose-50/50 hover:bg-rose-50">
            <input
              type="file"
              accept="video/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
            ) : (
              <>
                <Video className="w-8 h-8 text-rose-400 mb-1" />
                <span className="text-xs text-rose-500">Add Video</span>
              </>
            )}
          </label>
        )}
      </div>
    </div>
  );
}