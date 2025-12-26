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
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import BlockButton from '@/components/blocking/BlockButton';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [viewingUserEmail, setViewingUserEmail] = useState(null);
  const [showDuplicateError, setShowDuplicateError] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    age: '',
    gender: '',
    interested_in: '',
    interests: [],
    hobbies: '',
    looking_for: '',
    avatar_url: '',
    photos: [],
    videos: []
  });
  const [interestInput, setInterestInput] = useState('');
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
        interests: displayProfile.interests || [],
        hobbies: displayProfile.hobbies || '',
        looking_for: displayProfile.looking_for || '',
        avatar_url: displayProfile.avatar_url || '',
        photos: displayProfile.photos || [],
        videos: displayProfile.videos || []
      });
    } else if (user && isOwnProfile) {
      setFormData((prev) => ({
        ...prev,
        display_name: user.full_name || ''
      }));
    }
  }, [displayProfile, user, isOwnProfile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      try {
        // Always check for existing profile to handle race conditions
        const existingProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        
        if (existingProfiles.length > 0) {
          // Update existing profile
          const result = await base44.entities.UserProfile.update(existingProfiles[0].id, data);
          return result;
        } else {
          // Create new profile
          const result = await base44.entities.UserProfile.create({
            user_email: user.email,
            ...data
          });
          return result;
        }
      } catch (error) {
        console.error('Profile save error:', error);
        throw error;
      }
    },
    onSuccess: async (result) => {
      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['viewingProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['activeUsers'] });
      await queryClient.refetchQueries({ queryKey: ['myProfile', user?.email] });
      toast.success('Profile saved successfully!');
    },
    onError: (error) => {
      toast.error('Failed to save profile: ' + (error.message || 'Unknown error'));
      console.error('Save error:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (myProfile) {
        await base44.entities.UserProfile.delete(myProfile.id);
      }
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      setTimeout(() => {
        base44.auth.logout();
      }, 1000);
    },
    onError: () => {
      toast.error('Failed to delete account');
    }
  });

  const handleSave = () => {
    // Validate required fields (only Age, Gender, Interested In are mandatory)
    if (!formData.display_name || !formData.age || !formData.gender || !formData.interested_in || !formData.avatar_url) {
      toast.error('Please complete all required fields (Display Name, Age, Gender, Interested In, and Profile Picture)');
      return;
    }
    // Validate age requirement
    if (formData.age < 18) {
      toast.error('You must be at least 18 years old to create a profile');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleDeleteAccount = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  if (!user || isLoading || viewingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 pb-20">
      {/* Duplicate Profile Error Dialog */}
      <AlertDialog open={showDuplicateError} onOpenChange={setShowDuplicateError}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Profile Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              A profile already exists for this email address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDuplicateError(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your account and all associated data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDeleteDialog(false)}>
              No
            </AlertDialogAction>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          {isOwnProfile ? (
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white">
              {saveMutation.isPending ?
            <Loader2 className="w-4 h-4 animate-spin" /> :

            <Save className="w-4 h-4" />
            }
            </Button>
          ) : (
            <BlockButton 
              targetUserEmail={viewingUserEmail}
              currentUserEmail={user?.email}
              variant="destructive"
            />
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Avatar Section */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}>

          {isOwnProfile ?
          <AvatarUpload
            currentAvatar={formData.avatar_url}
            onAvatarChange={(url) => setFormData((prev) => ({ ...prev, avatar_url: url }))} /> :


          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
              <img
              src={formData.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'}
              alt="Profile"
              className="w-full h-full object-cover"
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
              style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' }} />

            </div>
          }
        </motion.div>

        {/* Profile Form */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>

          <h2 className="text-lg font-semibold text-slate-800 mb-4">Basic Info</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name" className="text-slate-600">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
                placeholder="Your display name"
                className="mt-1 rounded-xl border-slate-200"
                disabled={!isOwnProfile} />

            </div>

            <div>
              <Label htmlFor="bio" className="text-slate-600">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell others about yourself..."
                className="mt-1 rounded-xl border-slate-200 resize-none"
                rows={3}
                disabled={!isOwnProfile} />

            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="age" className="text-slate-600">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  value={formData.age}
                  onChange={(e) => setFormData((prev) => ({ ...prev, age: parseInt(e.target.value) || '' }))}
                  placeholder="Age"
                  className="mt-1 rounded-xl border-slate-200"
                  disabled={!isOwnProfile} />

              </div>

              <div>
                <Label className="text-slate-600">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                  disabled={!isOwnProfile}>

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
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, interested_in: value }))}
                  disabled={!isOwnProfile}>

                  <SelectTrigger className="mt-1 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                    <SelectItem value="transgender">Transgender</SelectItem>
                    <SelectItem value="everyone">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>

              <div>
              <Label htmlFor="interests" className="text-slate-600">Interests (Tags)</Label>
              <div className="mt-1 space-y-2">
                {isOwnProfile && (
                  <div className="flex gap-2">
                    <Input
                      id="interests"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && interestInput.trim()) {
                          e.preventDefault();
                          if (!formData.interests.includes(interestInput.trim())) {
                            setFormData((prev) => ({
                              ...prev,
                              interests: [...prev.interests, interestInput.trim()]
                            }));
                          }
                          setInterestInput('');
                        }
                      }}
                      placeholder="Add interest (press Enter)"
                      className="rounded-xl border-slate-200" />
                    <Button
                      type="button"
                      onClick={() => {
                        if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
                          setFormData((prev) => ({
                            ...prev,
                            interests: [...prev.interests, interestInput.trim()]
                          }));
                          setInterestInput('');
                        }
                      }}
                      className="bg-violet-600 hover:bg-violet-700 text-white">
                      Add
                    </Button>
                  </div>
                )}
                {formData.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm flex items-center gap-2">
                        {interest}
                        {isOwnProfile && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                interests: prev.interests.filter((_, i) => i !== index)
                              }));
                            }}
                            className="hover:text-violet-900">
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              </div>

              <div>
              <Label htmlFor="hobbies" className="text-slate-600">Hobbies</Label>
              <Textarea
                id="hobbies"
                value={formData.hobbies}
                onChange={(e) => setFormData((prev) => ({ ...prev, hobbies: e.target.value }))}
                placeholder="What do you like to do in your free time?"
                className="mt-1 rounded-xl border-slate-200 resize-none"
                rows={2}
                disabled={!isOwnProfile} />
              </div>

              <div>
              <Label htmlFor="looking_for" className="text-slate-600">Looking For</Label>
              <Textarea
                id="looking_for"
                value={formData.looking_for}
                onChange={(e) => setFormData((prev) => ({ ...prev, looking_for: e.target.value }))}
                placeholder="What kind of connection are you seeking?"
                className="mt-1 rounded-xl border-slate-200 resize-none"
                rows={2}
                disabled={!isOwnProfile} />
              </div>
              </div>
              </motion.div>

              {/* Media Galleries */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>

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
                onPhotosChange={(photos) => setFormData((prev) => ({ ...prev, photos }))}
                editable={isOwnProfile} />

            </TabsContent>
            
            <TabsContent value="videos">
              <VideoGallery
                videos={formData.videos}
                onVideosChange={(videos) => setFormData((prev) => ({ ...prev, videos }))}
                editable={isOwnProfile} />

            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Delete Account Section - Only for own profile */}
        {isOwnProfile && (
          <motion.div
            className="bg-white rounded-2xl shadow-lg p-6 mt-6 border-2 border-red-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}>
            <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
            <p className="text-sm text-slate-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteMutation.isPending}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </motion.div>
        )}
      </main>
    </div>);

}