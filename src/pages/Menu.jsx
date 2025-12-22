import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MessageCircle, Heart, Users, Info, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import NotificationBadge from '@/components/notifications/NotificationBadge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Menu() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
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

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: async () => {
      if (!user?.email) return 0;
      const allMessages = await base44.entities.Message.filter({
        receiver_email: user.email,
        read: false
      });
      return allMessages.length;
    },
    enabled: !!user?.email,
    refetchInterval: 5000
  });

  const menuItems = [
    {
      label: 'Chat',
      icon: MessageCircle,
      path: 'Chat',
      badge: unreadCount,
      color: 'bg-purple-400',
      description: 'View your messages'
    },
    {
      label: 'Discover',
      icon: Heart,
      path: 'Discover',
      color: 'bg-fuchsia-300',
      description: 'Find new connections'
    },
    {
      label: 'All Profiles',
      icon: Users,
      path: 'AllProfiles',
      color: 'bg-violet-300',
      description: 'Browse all members nearby'
    },
    {
      label: 'Members Online',
      icon: Users,
      path: 'OnlineMembers',
      color: 'bg-emerald-300',
      description: 'See who\'s active now'
    },
    {
      label: 'About',
      icon: Info,
      path: 'About',
      color: 'bg-blue-300',
      description: 'Learn more about us'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Menu</h1>
          <div className="w-9"></div>
        </div>
      </header>

      {/* Menu Items */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={createPageUrl(item.path)}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`${item.color} w-16 h-16 rounded-full flex items-center justify-center relative`}>
                      <Icon className="w-8 h-8 text-slate-700" />
                      {item.badge > 0 && (
                        <NotificationBadge count={item.badge} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-800 mb-1">
                        {item.label}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}