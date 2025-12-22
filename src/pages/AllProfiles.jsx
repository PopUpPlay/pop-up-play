import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Calculate distance between two coordinates in miles using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
  
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

export default function AllProfiles() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

  const { data: myProfile } = useQuery({
    queryKey: ['myProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: allProfiles = [], isLoading } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list();
      return profiles;
    },
    enabled: !!user?.email
  });

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['blockedUsers', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const blocked = await base44.entities.BlockedUser.filter({
        blocker_email: user.email
      });
      return blocked;
    },
    enabled: !!user?.email
  });

  const sortedProfiles = React.useMemo(() => {
    if (!myProfile?.latitude || !myProfile?.longitude) return allProfiles;
    
    return [...allProfiles]
      .filter(p => !blockedUsers.some(b => b.blocked_email === p.user_email)) // Exclude blocked
      .map(p => ({
        ...p,
        distance: calculateDistance(
          myProfile.latitude,
          myProfile.longitude,
          p.latitude,
          p.longitude
        )
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [allProfiles, myProfile, blockedUsers]);

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Menu')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">All Profiles</h1>
          <div className="w-9"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Count */}
        <motion.div
          className="mb-6 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-slate-600">
            {sortedProfiles.length} {sortedProfiles.length === 1 ? 'profile' : 'profiles'} nearby
          </p>
        </motion.div>

        {/* Profiles Grid */}
        {sortedProfiles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">No profiles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProfiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => navigate(createPageUrl('Profile') + '?user=' + profile.user_email)}
              >
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Avatar */}
                  <div className="aspect-square relative">
                    <img
                      src={profile.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'}
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                    {profile.is_popped_up && (
                      <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      {profile.display_name || 'Anonymous'}
                      {profile.age && <span className="text-slate-500">, {profile.age}</span>}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                      <MapPin className="w-4 h-4" />
                      {profile.current_city && <span>{profile.current_city}</span>}
                      {profile.distance && profile.distance !== 999999 && (
                        <span className="text-violet-600 font-medium">
                          {profile.distance === 0 ? 'You' : `${profile.distance.toFixed(1)} mi`}
                        </span>
                      )}
                    </div>

                    {profile.bio && (
                      <p className="text-sm text-slate-600 line-clamp-2">{profile.bio}</p>
                    )}

                    {profile.is_popped_up && profile.popup_message && (
                      <div className="mt-3 p-2 bg-violet-50 rounded-lg">
                        <p className="text-xs text-violet-700 italic line-clamp-2">
                          "{profile.popup_message}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}