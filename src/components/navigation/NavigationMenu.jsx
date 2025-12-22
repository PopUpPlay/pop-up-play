import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, MessageCircle, Heart, Users, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBadge from '@/components/notifications/NotificationBadge';

export default function NavigationMenu({ unreadCount = 0 }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      label: 'Chat',
      icon: MessageCircle,
      path: 'Chat',
      badge: unreadCount,
      color: 'bg-purple-400'
    },
    {
      label: 'Discover',
      icon: Heart,
      path: 'Discover',
      color: 'bg-fuchsia-300'
    },
    {
      label: 'Members Online',
      icon: Users,
      path: 'OnlineMembers',
      color: 'bg-emerald-300'
    },
    {
      label: 'About',
      icon: Info,
      path: 'About',
      color: 'bg-blue-300'
    }
  ];

  return (
    <>
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-slate-100 hover:bg-slate-200"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </Button>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={createPageUrl(item.path)}
                      onClick={() => setIsOpen(false)}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div className={`${item.color} w-12 h-12 rounded-full flex items-center justify-center relative`}>
                          <Icon className="w-6 h-6 text-slate-700" />
                          {item.badge > 0 && (
                            <NotificationBadge count={item.badge} />
                          )}
                        </div>
                        <span className="text-lg font-semibold text-slate-800 group-hover:text-violet-600 transition-colors">
                          {item.label}
                        </span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}