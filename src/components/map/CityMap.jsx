import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import UserMarker from './UserMarker';
import { Loader2 } from 'lucide-react';

function MapController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 11, { duration: 1.5 });
    }
  }, [center, map]);
  
  return null;
}

export default function CityMap({ activeUsers, currentUserProfile, userLocation }) {
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default NYC
  
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation]);

  // Group users by city and show them at approximate city center
  const getUsersWithCityLocation = () => {
    const cityGroups = {};
    
    activeUsers.forEach(profile => {
      if (!profile.current_city || !profile.latitude || !profile.longitude) return;
      
      if (!cityGroups[profile.current_city]) {
        cityGroups[profile.current_city] = {
          baseLat: profile.latitude,
          baseLon: profile.longitude,
          users: []
        };
      }
      
      cityGroups[profile.current_city].users.push(profile);
    });
    
    // Position users in their city with small clustering offset
    return activeUsers.map(profile => {
      if (!profile.current_city || !profile.latitude || !profile.longitude) return profile;
      
      const cityData = cityGroups[profile.current_city];
      const userIndex = cityData.users.findIndex(u => u.id === profile.id);
      
      // Small offset for visual clustering, not revealing exact location
      const angle = (userIndex / cityData.users.length) * 2 * Math.PI;
      const radius = 0.01; // ~0.5 mile radius for clustering
      
      return {
        ...profile,
        displayLatitude: cityData.baseLat + (Math.cos(angle) * radius),
        displayLongitude: cityData.baseLon + (Math.sin(angle) * radius)
      };
    });
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl">
      <MapContainer
        center={mapCenter}
        zoom={11}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapController center={mapCenter} />
        
        {getUsersWithCityLocation().map(profile => (
          <UserMarker 
            key={profile.id} 
            profile={profile}
            isCurrentUser={currentUserProfile?.id === profile.id}
          />
        ))}
      </MapContainer>
      
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-400 animate-pulse"></div>
          <span className="text-sm text-slate-600 font-medium">{activeUsers.length} active nearby</span>
        </div>
      </div>
    </div>
  );
}