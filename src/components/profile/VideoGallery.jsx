import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Video, Loader2, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export default function VideoGallery({ videos = [], onVideosChange, editable = true }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const ffmpegRef = useRef(new FFmpeg());
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const loadFFmpeg = async () => {
    if (ffmpegLoaded) return true;
    
    try {
      const ffmpeg = ffmpegRef.current;
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setFfmpegLoaded(true);
      return true;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      return false;
    }
  };

  const compressVideo = async (file) => {
    const ffmpeg = ffmpegRef.current;
    
    setStatusMessage('Loading video processor...');
    const loaded = await loadFFmpeg();
    if (!loaded) {
      throw new Error('Failed to load video processor');
    }

    setStatusMessage('Compressing video...');
    setUploadProgress(10);

    // Write input file
    await ffmpeg.writeFile('input.mp4', await fetchFile(file));
    setUploadProgress(20);

    // Compress to 1080p max, CRF 28 for good quality/size balance
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vf', 'scale=min(1920\\,iw):-2',
      '-c:v', 'libx264',
      '-crf', '28',
      '-preset', 'medium',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      'output.mp4'
    ]);
    
    setUploadProgress(70);

    // Read compressed file
    const data = await ffmpeg.readFile('output.mp4');
    const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });
    
    // Clean up
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('output.mp4');

    setStatusMessage('Upload complete!');
    setUploadProgress(80);

    return new File([compressedBlob], file.name, { type: 'video/mp4' });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setStatusMessage('');
    
    try {
      let fileToUpload = file;
      
      // Compress if over 50MB or always compress for quality
      if (file.size > 50 * 1024 * 1024 || true) {
        fileToUpload = await compressVideo(file);
        
        // Check if still too large after compression
        if (fileToUpload.size > 200 * 1024 * 1024) {
          toast.error('Video is too large even after compression. Please use a shorter video.');
          setUploading(false);
          return;
        }
      }

      setStatusMessage('Uploading...');
      setUploadProgress(85);

      const { file_url } = await base44.integrations.Core.UploadFile({ file: fileToUpload });
      
      setUploadProgress(100);
      onVideosChange([...videos, file_url]);
      toast.success('Video uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload video: ' + (error.message || 'Unknown error'));
      setUploadProgress(0);
    }
    
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      setStatusMessage('');
    }, 500);
  };

  const handleRemove = (index) => {
    const newVideos = videos.filter((_, i) => i !== index);
    onVideosChange(newVideos);
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
                {statusMessage && (
                  <span className="text-xs text-slate-600 text-center px-2">
                    {statusMessage}
                  </span>
                )}
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