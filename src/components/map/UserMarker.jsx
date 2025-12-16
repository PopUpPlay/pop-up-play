import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserMarker({ profile, isCurrentUser }) {
  const [isHovered, setIsHovered] = useState(false);

  const createCustomIcon = () => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="relative">
          <div class="w-12 h-12 rounded-full border-3 ${isCurrentUser ? 'border-violet-500' : 'border-rose-400'} overflow-hidden shadow-lg bg-white p-0.5 transform transition-transform hover:scale-110">
            <img src="${profile.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'}" class="w-full h-full rounded-full object-cover" />
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 ${isCurrentUser ? 'bg-violet-500' : 'bg-rose-400'} rotate-45"></div>
        </div>
      `,
      iconSize: [48, 56],
      iconAnchor: [24, 56],
      popupAnchor: [0, -56]
    });
  };

  if (!profile.latitude || !profile.longitude) return null;

  return (
    <Marker
      position={[profile.latitude, profile.longitude]}
      icon={createCustomIcon()}
      eventHandlers={{
        mouseover: () => setIsHovered(true),
        mouseout: () => setIsHovered(false)
      }}
    >
      <Popup className="custom-popup">
        <div className="p-3 min-w-[200px]">
          <div className="flex items-center gap-3 mb-2">
            <img 
              src={profile.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'} 
              className="w-12 h-12 rounded-full object-cover border-2 border-violet-200"
              alt={profile.display_name}
            />
            <div>
              <h3 className="font-semibold text-slate-800">{profile.display_name || 'Anonymous'}</h3>
              {profile.age && <p className="text-sm text-slate-500">{profile.age} years old</p>}
            </div>
          </div>
          {profile.popup_message && (
            <div className="bg-gradient-to-r from-violet-50 to-rose-50 rounded-lg p-3 mt-2">
              <p className="text-sm text-slate-700 italic">"{profile.popup_message}"</p>
            </div>
          )}
          <p className="text-xs text-slate-400 mt-2">📍 {profile.current_city || 'Unknown location'}</p>
        </div>
      </Popup>
    </Marker>
  );
}