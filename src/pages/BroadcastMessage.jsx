import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function BroadcastMessage() {
  const [user, setUser] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          toast.error('Admin access required');
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

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('broadcastMessage', {
        subject,
        message
      });

      setResult(response.data);
      
      if (response.data.success) {
        toast.success(response.data.message);
        setSubject('');
        setMessage('');
      } else {
        toast.error('Broadcast failed');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send broadcast');
      setResult({ success: false, error: error.message });
    } finally {
      setIsSending(false);
    }
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
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Broadcast Message</h1>
          <div className="w-9"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Broadcast Form */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-6">
            <div>
              <Label htmlFor="subject" className="text-slate-700 font-semibold">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="mt-2 rounded-xl border-slate-200"
                disabled={isSending}
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-slate-700 font-semibold">
                Message
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your broadcast message here..."
                className="mt-2 rounded-xl border-slate-200 resize-none"
                rows={12}
                disabled={isSending}
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !message.trim()}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-6 text-lg rounded-xl"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending to all users...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Broadcast
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div
            className={`rounded-2xl shadow-lg p-6 ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Broadcast Sent Successfully' : 'Broadcast Failed'}
                </h3>
                {result.message && (
                  <p className={`text-sm mb-3 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                  </p>
                )}
                {result.totalUsers && (
                  <div className="space-y-1 text-sm text-slate-700">
                    <p>Total Users: {result.totalUsers}</p>
                    <p>Successfully Sent: {result.successCount}</p>
                    {result.failedCount > 0 && (
                      <p className="text-red-600">Failed: {result.failedCount}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This message will be sent to all registered users via email. 
            Make sure your message is clear and relevant to all recipients.
          </p>
        </motion.div>
      </main>
    </div>
  );
}