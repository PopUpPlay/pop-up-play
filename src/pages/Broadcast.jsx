import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

export default function Broadcast() {
  const [user, setUser] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch (err) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: broadcasts = [] } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: async () => {
      const data = await base44.entities.BroadcastMessage.list('-created_date', 20);
      return data;
    },
    enabled: !!user
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async ({ subject, message }) => {
      const response = await base44.functions.invoke('sendBroadcast', { subject, message });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Broadcast sent to ${data.recipients} users!`);
      setSubject('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to send broadcast');
    }
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    sendBroadcastMutation.mutate({ subject, message });
  };

  if (!user) {
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Broadcast Messages</h1>
          <div className="w-9"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Compose Broadcast */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Send New Broadcast</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject" className="text-slate-600">Subject (Optional)</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject..."
                className="mt-1 rounded-xl border-slate-200"
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-slate-600">Message *</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message to all users..."
                className="mt-1 rounded-xl border-slate-200 resize-none"
                rows={6}
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={sendBroadcastMutation.isPending}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {sendBroadcastMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                  Sending to all users...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2 text-white" />
                  Send Broadcast to All Users
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Broadcast History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Broadcasts</h2>
          
          {broadcasts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-slate-500">No broadcasts sent yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((broadcast) => (
                <Card key={broadcast.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {broadcast.subject && (
                        <h3 className="font-semibold text-slate-800 mb-1">{broadcast.subject}</h3>
                      )}
                      <p className="text-sm text-slate-600 mb-2">{broadcast.message}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>{new Date(broadcast.created_date).toLocaleString()}</span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Sent to {broadcast.recipient_count} users
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}