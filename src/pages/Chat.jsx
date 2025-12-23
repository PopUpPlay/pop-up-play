import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ChatList from '@/components/chat/ChatList';
import ChatConversation from '@/components/chat/ChatConversation';

export default function Chat() {
  const [user, setUser] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [backUrl, setBackUrl] = useState(createPageUrl('Menu'));
  const queryClient = useQueryClient();

  // Check for user parameter in URL and determine back button destination
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userEmail = params.get('user');
    if (userEmail) {
      // Store it to select match once matches are loaded
      sessionStorage.setItem('chatWithUser', userEmail);
      // If coming from URL with user param (map popup), set back to Home
      setBackUrl(createPageUrl('Home'));
    } else {
      // Otherwise, back to Menu
      setBackUrl(createPageUrl('Menu'));
    }
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

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['blockedUsers', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.BlockedUser.filter({ blocker_email: user.email });
    },
    enabled: !!user?.email
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['matches', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allMatches = await base44.entities.Match.filter({ status: 'matched' });
      const myMatches = allMatches.filter(
        (m) => m.user1_email === user.email || m.user2_email === user.email
      );
      // Filter out matches with blocked users
      return myMatches.filter(match => {
        const otherUserEmail = match.user1_email === user.email ? match.user2_email : match.user1_email;
        return !blockedUsers.some(b => b.blocked_email === otherUserEmail);
      });
    },
    enabled: !!user?.email && blockedUsers !== undefined,
    refetchInterval: 10000
  });

  // Auto-select match if user parameter provided
  useEffect(() => {
    const targetUser = sessionStorage.getItem('chatWithUser');
    if (targetUser && matches.length > 0 && user?.email) {
      const match = matches.find((m) =>
      m.user1_email === targetUser || m.user2_email === targetUser
      );
      if (match) {
        setSelectedMatch(match);
        sessionStorage.removeItem('chatWithUser');
      }
    }
  }, [matches, user?.email]);

  const { data: profiles = [] } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.UserProfile.list(),
    refetchInterval: 30000
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedMatch?.id],
    queryFn: async () => {
      if (!selectedMatch?.id) return [];
      return base44.entities.Message.filter({ match_id: selectedMatch.id }, '-created_date');
    },
    enabled: !!selectedMatch?.id,
    refetchInterval: 2000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, attachment_url }) => {
      const otherUserEmail = selectedMatch.user1_email === user.email ?
      selectedMatch.user2_email :
      selectedMatch.user1_email;

      const message = await base44.entities.Message.create({
        match_id: selectedMatch.id,
        sender_email: user.email,
        receiver_email: otherUserEmail,
        content,
        attachment_url
      });

      // Send email notification to receiver
      try {
        const senderProfile = profiles.find(p => p.user_email === user.email);
        const senderName = senderProfile?.display_name || user.full_name || 'Someone';
        
        await base44.integrations.Core.SendEmail({
          to: otherUserEmail,
          subject: `New message from ${senderName}`,
          body: `You have received a new message from ${senderName}.\n\nMessage: ${content}\n\nLog in to Pop Up Play to reply.`
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  const handleSendMessage = async (content, attachment_url = null) => {
    await sendMessageMutation.mutateAsync({ content, attachment_url });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>);

  }

  const otherProfile = selectedMatch ? profiles.find((p) =>
  p.user_email === (selectedMatch.user1_email === user.email ? selectedMatch.user2_email : selectedMatch.user1_email)
  ) : null;

  return (
    <div className="h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Menu')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <MessageCircle className="w-6 h-6 text-violet-600" />
          <h1 className="text-violet-600 text-xl font-bold">Messages</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid md:grid-cols-[380px,1fr] h-full bg-white shadow-xl overflow-hidden">
            {/* Chat List - Hidden on mobile when chat is selected */}
            <div className={`
              border-r border-slate-200 
              ${selectedMatch ? 'hidden md:block' : 'block'}
              h-full overflow-hidden
            `}>
              <ChatList
                matches={matches}
                profiles={profiles}
                messages={messages}
                selectedMatchId={selectedMatch?.id}
                onSelectMatch={setSelectedMatch}
                currentUserEmail={user.email} />

            </div>

            {/* Conversation - Hidden on mobile when no chat selected */}
            <div className={`
              ${selectedMatch ? 'block' : 'hidden md:flex md:items-center md:justify-center'}
              h-full
            `}>
              {selectedMatch && otherProfile ?
              <ChatConversation
                match={selectedMatch}
                otherProfile={otherProfile}
                messages={messages.sort((a, b) =>
                new Date(a.created_date) - new Date(b.created_date)
                )}
                currentUserEmail={user.email}
                onBack={() => setSelectedMatch(null)}
                onSendMessage={handleSendMessage}
                isSending={sendMessageMutation.isPending} /> :


              <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-violet-100 flex items-center justify-center">
                    <MessageCircle className="w-10 h-10 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-slate-500">
                    Choose a match to start chatting
                  </p>
                </div>
              }
            </div>
          </div>
        </div>
      </main>
    </div>);

}