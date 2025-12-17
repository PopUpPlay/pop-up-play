import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AvatarUpload from '@/components/profile/AvatarUpload';
import PhotoGallery from '@/components/profile/PhotoGallery';
import VideoGallery from '@/components/profile/VideoGallery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [viewingUserEmail, setViewingUserEmail] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    age: '',
    gender: '',
    interested_in: '',
    avatar_url: '',
    photos: [],
    videos: []
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    setViewingUserEmail(userParam);
  }, []);

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

  const { data: myProfile, isLoading } = useQuery({
    queryKey: ['myProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: viewingProfile, isLoading: viewingLoading } = useQuery({
    queryKey: ['viewingProfile', viewingUserEmail],
    queryFn: async () => {
      if (!viewingUserEmail) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: viewingUserEmail });
      return profiles[0] || null;
    },
    enabled: !!viewingUserEmail
  });

  const isOwnProfile = !viewingUserEmail || viewingUserEmail === user?.email;
  const displayProfile = isOwnProfile ? myProfile : viewingProfile;

  useEffect(() => {
    if (displayProfile) {
      setFormData({
        display_name: displayProfile.display_name || '',
        bio: displayProfile.bio || '',
        age: displayProfile.age || '',
        gender: displayProfile.gender || '',
        interested_in: displayProfile.interested_in || '',
        avatar_url: displayProfile.avatar_url || '',
        photos: displayProfile.photos || [],
        videos: displayProfile.videos || []
      });
    } else if (user && isOwnProfile) {
      setFormData(prev => ({
        ...prev,
        display_name: user.full_name || ''
      }));
    }
  }, [displayProfile, user, isOwnProfile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (myProfile) {
        return base44.entities.UserProfile.update(myProfile.id, data);
      } else {
        return base44.entities.UserProfile.create({
          user_email: user.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      toast.success('Profile saved successfully!');
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (!user || isLoading || viewingLoading) {
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
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">
            {isOwnProfile ? 'Edit Profile' : displayProfile?.display_name || 'Profile'}
          </h1>
          {isOwnProfile && (
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-full"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
          )}
          {!isOwnProfile && <div className="w-10"></div>}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Avatar Section */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {isOwnProfile ? (
            <AvatarUpload 
              currentAvatar={formData.avatar_url}
              onAvatarChange={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
            />
          ) : (
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
              <img 
                src={formData.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'} 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </motion.div>

        {/* Profile Form */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Basic Info</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name" className="text-slate-600">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Your display name"
                className="mt-1 rounded-xl border-slate-200"
                disabled={!isOwnProfile}
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-slate-600">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell others about yourself..."
                className="mt-1 rounded-xl border-slate-200 resize-none"
                rows={3}
                disabled={!isOwnProfile}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="age" className="text-slate-600">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || '' }))}
                  placeholder="Age"
                  className="mt-1 rounded-xl border-slate-200"
                  disabled={!isOwnProfile}
                />
              </div>

              <div>
                <Label className="text-slate-600">Gender</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  disabled={!isOwnProfile}
                >
                  <SelectTrigger className="mt-1 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-600">Interested In</Label>
                <Select 
                  value={formData.interested_in} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, interested_in: value }))}
                  disabled={!isOwnProfile}
                >
                  <SelectTrigger className="mt-1 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                    <SelectItem value="everyone">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Media Galleries */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="w-full mb-4 bg-slate-100 rounded-xl p-1">
              <TabsTrigger value="photos" className="flex-1 rounded-lg data-[state=active]:bg-white">
                Photos
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex-1 rounded-lg data-[state=active]:bg-white">
                Videos
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="photos">
              <PhotoGallery 
                photos={formData.photos}
                onPhotosChange={(photos) => setFormData(prev => ({ ...prev, photos }))}
                editable={isOwnProfile}
              />
            </TabsContent>
            
            <TabsContent value="videos">
              <VideoGallery 
                videos={formData.videos}
                onVideosChange={(videos) => setFormData(prev => ({ ...prev, videos }))}
                editable={isOwnProfile}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}