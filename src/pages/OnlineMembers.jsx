import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Video, MessageCircle, Loader2, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function OnlineMembers() {
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

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['blockedUsers', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.BlockedUser.filter({ blocker_email: user.email });
    },
    enabled: !!user?.email
  });

  const { data: activeProfiles = [], isLoading } = useQuery({
    queryKey: ['activeProfiles'],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ is_popped_up: true });
      return profiles;
    },
    refetchInterval: 30000,
    enabled: !!user?.email
  });

  const { data: myProfile } = useQuery({
    queryKey: ['myProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const filteredProfiles = activeProfiles.filter((profile) => {
    return !blockedUsers.some(b => b.blocked_email === profile.user_email);
  });

  const handleVideoCall = (otherUserEmail) => {
    const callId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    navigate(createPageUrl('VideoCall') + `?user=${otherUserEmail}&callId=${callId}`);
  };

  const handleChat = (otherUserEmail) => {
    navigate(createPageUrl('Chat') + `?user=${otherUserEmail}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-600" />
            <h1 className="text-lg font-semibold text-slate-800">Online Now</h1>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm p-4 mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-2xl font-bold text-violet-600">{filteredProfiles.length}</p>
          <p className="text-sm text-slate-500">Members Online</p>
        </motion.div>

        {/* Members Grid */}
        {filteredProfiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No one online
            </h3>
            <p className="text-sm text-slate-500">
              Check back later to see who's around
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Profile Image */}
                <div className="relative h-64 bg-gradient-to-br from-violet-100 to-rose-100">
                  <img
                    src={profile.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Active
                  </div>
                </div>

                {/* Profile Info */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {profile.display_name}{profile.age && `, ${profile.age}`}
                      </h3>
                      {profile.current_city && (
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          {profile.current_city}
                        </div>
                      )}
                    </div>
                  </div>

                  {profile.popup_message && (
                    <div className="bg-violet-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-slate-700 italic line-clamp-2">
                        "{profile.popup_message}"
                      </p>
                    </div>
                  )}

                  {profile.bio && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleVideoCall(profile.user_email)}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 gap-2"
                    >
                      <Video className="w-4 h-4" />
                      Video Call
                    </Button>
                    <Button
                      onClick={() => handleChat(profile.user_email)}
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </Button>
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