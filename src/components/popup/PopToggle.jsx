import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, MapPinOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function PopToggle({ isPopped, message, onToggle, onMessageChange, isLoading }) {
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [tempMessage, setTempMessage] = useState(message || '');

  const handleToggleClick = () => {
    if (isPopped) {
      onToggle(false, '');
    } else {
      setShowMessageInput(true);
    }
  };

  const handlePopUp = () => {
    if (tempMessage.trim()) {
      onToggle(true, tempMessage);
      setShowMessageInput(false);
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={handleToggleClick}
        disabled={isLoading}
        className={`
          relative overflow-hidden rounded-full px-8 py-4 font-semibold text-lg
          transition-all duration-500 shadow-lg
          ${isPopped 
            ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-200' 
            : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-violet-200'
          }
          hover:shadow-xl hover:scale-105 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="flex items-center gap-3">
          {isPopped ? (
            <>
              <MapPinOff className="w-5 h-5" />
              Pop Down
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5" />
              Pop Up
            </>
          )}
        </span>
        
        <motion.div
          className="absolute inset-0 bg-white/20"
          initial={false}
          animate={{ 
            x: isPopped ? '100%' : '-100%',
            opacity: 0 
          }}
          transition={{ duration: 0.5 }}
        />
      </motion.button>

      <AnimatePresence>
        {showMessageInput && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-80 bg-white rounded-2xl shadow-2xl p-5 border border-violet-100 z-50"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-violet-500" />
              <Label className="text-slate-700 font-semibold">What are you looking for?</Label>
            </div>
            <Textarea
              value={tempMessage}
              onChange={(e) => setTempMessage(e.target.value)}
              placeholder="E.g., Looking for someone to grab coffee with tonight..."
              className="mb-4 resize-none border-violet-200 focus:border-violet-400 rounded-xl"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMessageInput(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePopUp}
                disabled={!tempMessage.trim()}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl"
              >
                Go Live
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}