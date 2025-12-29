import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function About() {
  const [user, setUser] = useState(null);

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Menu')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-purple-600 text-xl font-bold">About Pop Up Play</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div 
            className="aspect-video"
            dangerouslySetInnerHTML={{
              __html: `
                <script src="https://fast.wistia.com/player.js" async></script>
                <script src="https://fast.wistia.com/embed/h92sg0p3wb.js" async type="module"></script>
                <style>wistia-player[media-id='h92sg0p3wb']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/h92sg0p3wb/swatch'); display: block; filter: blur(5px); padding-top:56.25%; }</style>
                <wistia-player media-id="h92sg0p3wb" aspect="1.7777777777777777"></wistia-player>
              `
            }}
          />
        </motion.div>
      </main>
    </div>);

}