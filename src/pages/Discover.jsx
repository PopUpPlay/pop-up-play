import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ProfileCard from '@/components/profile/ProfileCard';
import { toast } from 'sonner';

export default function Discover() {
  const [user, setUser] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const queryClient = useQueryClient();

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

  const { data: activeProfiles = [], isLoading } = useQuery({
    queryKey: ['activeProfiles'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ is_popped_up: true });
      return profiles.filter(p => p.user_email !== user?.email);
    },
    enabled: !!user?.email,
    refetchInterval: 30000
  });

  const { data: myMatches = [] } = useQuery({
    queryKey: ['myMatches', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const matches = await base44.entities.Match.list();
      return matches.filter(
        m => m.user1_email === user.email || m.user2_email === user.email
      );
    },
    enabled: !!user?.email
  });

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['blockedUsers', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.BlockedUser.filter({ blocker_email: user.email });
    },
    enabled: !!user?.email
  });

  const likeMutation = useMutation({
    mutationFn: async (targetProfile) => {
      // Check if they already liked us
      const existingMatch = myMatches.find(m => 
        (m.user1_email === targetProfile.user_email && m.user2_email === user.email) ||
        (m.user2_email === targetProfile.user_email && m.user1_email === user.email)
      );

      if (existingMatch && existingMatch.status === 'pending') {
        // It's a match!
        await base44.entities.Match.update(existingMatch.id, { 
          status: 'matched',
          matched_date: new Date().toISOString()
        });
        return { isMatch: true };
      } else {
        // Create new pending match
        await base44.entities.Match.create({
          user1_email: user.email,
          user2_email: targetProfile.user_email,
          initiated_by: user.email,
          status: 'pending'
        });
        return { isMatch: false };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myMatches'] });
      if (data.isMatch) {
        toast.success("It's a match! 🎉", {
          description: "You can now chat with each other!"
        });
      } else {
        toast.success("Like sent! ❤️");
      }
      setSelectedProfile(null);
    }
  });

  const handleLike = (profile) => {
    likeMutation.mutate(profile);
  };

  // Filter out already matched/liked profiles and blocked users
  const availableProfiles = activeProfiles.filter(profile => {
    const isMatched = myMatches.some(match => 
      (match.user1_email === profile.user_email && match.user2_email === user?.email) ||
      (match.user2_email === profile.user_email && match.user1_email === user?.email)
    );
    const isBlocked = blockedUsers.some(b => b.blocked_email === profile.user_email);
    return !isMatched && !isBlocked;
  });

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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Sparkles className="w-6 h-6 text-violet-600" />
          <h1 className="text-xl font-bold text-slate-800">Discover</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {availableProfiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-12"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-violet-100 to-rose-100 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              No one around right now
            </h2>
            <p className="text-slate-600 mb-6">
              Check back later when more people are active in your area!
            </p>
            <Link to={createPageUrl('Home')}>
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600">
                Back to Map
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableProfiles.map((profile) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer group"
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="aspect-[3/4] overflow-hidden bg-slate-100">
                  <img
                    src={profile.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'}
                    alt={profile.display_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    {profile.display_name}
                    {profile.age && <span className="text-slate-500">, {profile.age}</span>}
                  </h3>
                  
                  {profile.popup_message && (
                    <p className="text-sm text-slate-600 line-clamp-2 italic mb-2">
                      "{profile.popup_message}"
                    </p>
                  )}
                  
                  {profile.current_city && (
                    <p className="text-xs text-slate-500">📍 {profile.current_city}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Profile Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <ProfileCard
            profile={selectedProfile}
            onLike={handleLike}
            onClose={() => setSelectedProfile(null)}
            isLiking={likeMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}