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
    <div className="relative">
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="rounded-full bg-slate-100 hover:bg-slate-200"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </Button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl z-[101] overflow-hidden border border-slate-100"
            >
              {/* Menu Items */}
              <div className="p-3 space-y-1">
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
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div className={`${item.color} w-11 h-11 rounded-full flex items-center justify-center relative`}>
                          <Icon className="w-5 h-5 text-slate-700" />
                          {item.badge > 0 && (
                            <NotificationBadge count={item.badge} />
                          )}
                        </div>
                        <span className="text-base font-semibold text-slate-800 group-hover:text-violet-600 transition-colors">
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
    </div>
  );
}