import React from 'react';
import { motion } from 'framer-motion';
import { Video, MessageCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ActiveMembersList({ members, currentUserEmail }) {
  const navigate = useNavigate();

  const filteredMembers = members.filter(m => m.user_email !== currentUserEmail);

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
    <div className="bg-white rounded-2xl shadow-2xl p-4 border border-violet-100 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
        <Users className="w-5 h-5 text-violet-600" />
        <h3 className="font-semibold text-slate-800">
          Active Members ({filteredMembers.length})
        </h3>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">No active members right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-r from-violet-50 to-rose-50 rounded-xl p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleProfileClick(member.user_email)}
                  className="flex-shrink-0"
                >
                  <img
                    src={member.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'}
                    alt={member.display_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm hover:scale-105 transition-transform"
                  />
                </button>
                
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleProfileClick(member.user_email)}
                    className="text-left w-full"
                  >
                    <h4 className="font-semibold text-slate-800 text-sm hover:text-violet-600 transition-colors">
                      {member.display_name || 'Anonymous'}
                    </h4>
                    {member.age && (
                      <p className="text-xs text-slate-500">{member.age} years old</p>
                    )}
                  </button>
                  
                  {member.popup_message && (
                    <div className="mt-2 bg-white/80 rounded-lg p-2">
                      <p className="text-xs text-slate-700 italic line-clamp-2">
                        "{member.popup_message}"
                      </p>
                    </div>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleVideoCall(member.user_email)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg px-2 py-1.5 shadow-sm transition-all hover:scale-105 flex items-center justify-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">Video Verify</span>
                    </button>
                    <button
                      onClick={() => handleChat(member.user_email)}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg p-1.5 shadow-sm transition-all hover:scale-110"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {member.current_city && (
                <p className="text-xs text-slate-400 mt-2 ml-15">
                  📍 {member.current_city}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}