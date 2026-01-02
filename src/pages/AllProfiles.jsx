import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Calculate distance between two coordinates in miles
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function AllProfiles() {
  const [user, setUser] = useState(null);
  const [interestFilter, setInterestFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [zipFilter, setZipFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
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
    let profiles = [...allProfiles]
      .filter(p => !blockedUsers.some(b => b.blocked_email === p.user_email)); // Exclude blocked
    
    // Filter by interests
    if (interestFilter.trim()) {
      profiles = profiles.filter(p => 
        p.interests && p.interests.some(interest => 
          interest.toLowerCase().includes(interestFilter.toLowerCase())
        )
      );
    }
    
    // Filter by city
    if (cityFilter) {
      profiles = profiles.filter(p => p.current_city === cityFilter);
    }
    
    // Filter by state
    if (stateFilter) {
      profiles = profiles.filter(p => p.current_state === stateFilter);
    }
    
    // Filter by ZIP
    if (zipFilter) {
      profiles = profiles.filter(p => p.current_zip === zipFilter);
    }
    
    // Filter by country
    if (countryFilter) {
      profiles = profiles.filter(p => p.current_country === countryFilter);
    }
    
    // Sort alphabetically by location (city, then state)
    profiles.sort((a, b) => {
      const aLocation = `${a.current_city || ''} ${a.current_state || ''}`.trim();
      const bLocation = `${b.current_city || ''} ${b.current_state || ''}`.trim();
      return aLocation.localeCompare(bLocation);
    });
    
    return profiles;
  }, [allProfiles, blockedUsers, interestFilter, cityFilter, stateFilter, zipFilter, countryFilter]);

  // Get unique values for filters
  const uniqueCities = React.useMemo(() => 
    [...new Set(allProfiles.map(p => p.current_city).filter(Boolean))].sort(),
    [allProfiles]
  );
  
  const uniqueStates = React.useMemo(() => 
    [...new Set(allProfiles.map(p => p.current_state).filter(Boolean))].sort(),
    [allProfiles]
  );
  
  const uniqueZips = React.useMemo(() => 
    [...new Set(allProfiles.map(p => p.current_zip).filter(Boolean))].sort(),
    [allProfiles]
  );
  
  const uniqueCountries = React.useMemo(() => 
    [...new Set(allProfiles.map(p => p.current_country).filter(Boolean))].sort(),
    [allProfiles]
  );

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
        {/* Filter Bar */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-slate-400" />
              <Input
                placeholder="Filter by interests (e.g., hiking, cooking)..."
                value={interestFilter}
                onChange={(e) => setInterestFilter(e.target.value)}
                className="flex-1 rounded-xl border-slate-200" />
              {interestFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInterestFilter('')}
                  className="text-slate-500">
                  Clear
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {uniqueCities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={zipFilter} onValueChange={setZipFilter}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="ZIP Code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ZIP Codes</SelectItem>
                  {uniqueZips.map(zip => (
                    <SelectItem key={zip} value={zip}>{zip}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="rounded-xl border-slate-200">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {uniqueCountries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(cityFilter || stateFilter || zipFilter || countryFilter) && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCityFilter('');
                    setStateFilter('');
                    setZipFilter('');
                    setCountryFilter('');
                  }}
                  className="text-slate-500">
                  Clear Location Filters
                </Button>
              </div>
            )}
          </div>
        </motion.div>

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
                onClick={() => navigate(createPageUrl('Profile') + '?user=' + profile.user_email + '&back=AllProfiles')}
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
                    
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 flex-wrap">
                      {(profile.current_city || profile.current_state || profile.current_country) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-purple-600" />
                          <span>
                            {[profile.current_city, profile.current_state, profile.current_country]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        profile.is_popped_up 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {profile.is_popped_up ? 'Popped Up' : 'Popped Down'}
                      </span>
                    </div>

                    {profile.interests && profile.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {profile.interests.slice(0, 3).map((interest, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs">
                            {interest}
                          </span>
                        ))}
                        {profile.interests.length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">
                            +{profile.interests.length - 3}
                          </span>
                        )}
                      </div>
                    )}

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