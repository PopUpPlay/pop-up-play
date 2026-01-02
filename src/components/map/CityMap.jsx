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

export default function CityMap({ activeUsers, currentUserProfile, userLocation, onProfileClick }) {
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default NYC
  const [cityCenters, setCityCenters] = useState({});
  
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation]);

  // Fetch city center coordinates
  useEffect(() => {
    const fetchCityCenters = async () => {
      const cities = [...new Set(activeUsers.map(u => u.current_city).filter(Boolean))];
      const newCenters = {};
      
      for (const city of cities) {
        if (cityCenters[city]) {
          newCenters[city] = cityCenters[city];
          continue;
        }
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json&limit=1`
          );
          const data = await response.json();
          if (data[0]) {
            newCenters[city] = {
              lat: parseFloat(data[0].lat),
              lon: parseFloat(data[0].lon)
            };
          }
        } catch (err) {
          console.error('Failed to fetch city center:', err);
        }
      }
      
      if (Object.keys(newCenters).length > 0) {
        setCityCenters(prev => ({ ...prev, ...newCenters }));
      }
    };
    
    if (activeUsers.length > 0) {
      fetchCityCenters();
    }
  }, [activeUsers.map(u => u.current_city).join(',')]);

  // Use precise latitude and longitude coordinates for each user
  const getUsersWithLocation = () => {
    return activeUsers.map(profile => ({
      ...profile,
      displayLatitude: profile.latitude,
      displayLongitude: profile.longitude
    }));
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl">
      <MapContainer
        center={mapCenter}
        zoom={11}
        minZoom={1}
        maxZoom={11}
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
            onProfileClick={onProfileClick}
          />
        ))}
      </MapContainer>
      
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg z-[1000]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-400 animate-pulse"></div>
          <span className="text-sm text-slate-600 font-medium">{activeUsers.length} active nearby</span>
        </div>
      </div>
    </div>
  );
}