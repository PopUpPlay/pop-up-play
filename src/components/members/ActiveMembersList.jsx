import React from 'react';
import { motion } from 'framer-motion';
import { Users, Video, MessageCircle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ActiveMembersList({ activeUsers, currentUserEmail }) {
  const navigate = useNavigate();

  const filteredUsers = activeUsers.filter(user => user.user_email !== currentUserEmail);

  const handleVideoCall = (userEmail) => {
    navigate(createPageUrl('VideoCall') + '?user=' + userEmail);
  };

  const handleChat = (userEmail) => {
    navigate(createPageUrl('Chat') + '?user=' + userEmail);
  };

  const handleProfileClick = (userEmail) => {
    navigate(createPageUrl('Profile') + '?user=' + userEmail);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-2xl shadow-xl p-4 h-full flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Active Now</h2>
          <p className="text-xs text-slate-500">{filteredUsers.length} members nearby</p>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500">No active members nearby</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="space-y-3">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-violet-50 to-rose-50 rounded-xl p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleProfileClick(user.user_email)}
                    className="flex-shrink-0"
                  >
                    <img
                      src={user.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'}
                      alt={user.display_name}
                      className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-md hover:scale-105 transition-transform cursor-pointer"
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleProfileClick(user.user_email)}
                      className="text-left hover:text-violet-600 transition-colors"
                    >
                      <h3 className="font-semibold text-slate-800 truncate">
                        {user.display_name || 'Anonymous'}
                      </h3>
                    </button>
                    {user.age && (
                      <p className="text-xs text-slate-500">{user.age} years old</p>
                    )}
                    {user.current_city && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {user.current_city}
                      </p>
                    )}
                    {user.popup_message && (
                      <div className="mt-2 bg-white/80 rounded-lg p-2">
                        <p className="text-xs text-slate-600 italic line-clamp-2">
                          "{user.popup_message}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={() => handleVideoCall(user.user_email)}
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                  >
                    <Video className="w-3.5 h-3.5 mr-1.5" />
                    <span className="text-xs font-semibold">Video Verify</span>
                  </Button>
                  <Button
                    onClick={() => handleChat(user.user_email)}
                    size="sm"
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md px-3"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
}