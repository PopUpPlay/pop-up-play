import React, { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { base44 } from '@/api/base44Client';
import SessionManager from '@/components/auth/SessionManager';
import InactivityManager from '@/components/auth/InactivityManager';
import BroadcastNotifications from '@/components/broadcasts/BroadcastNotifications';
import SubscriptionGate from '@/components/subscription/SubscriptionGate';

export default function Layout({ children, currentPageName }) {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setUserEmail(user.email);
      } catch (error) {
        // User not logged in
      }
    };
    loadUser();
  }, []);

  // Pages that don't require subscription check
  const publicPages = ['Pricing', 'SubscriptionSuccess', 'SubscriptionSettings'];
  const shouldCheckSubscription = !publicPages.includes(currentPageName);
  // Auto pop-down on browser close or logout
  useEffect(() => {
    const popDownUser = async () => {
      try {
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ 
          user_email: user.email 
        });
        
        if (profiles.length > 0 && profiles[0].is_popped_up) {
          await base44.entities.UserProfile.update(profiles[0].id, { 
            is_popped_up: false,
            popup_message: ''
          });
        }
      } catch (error) {
        // Silently fail - user might already be logged out
      }
    };

    // Handle browser close or tab close
    const handleBeforeUnload = () => {
      popDownUser();
    };

    // Intercept logout calls
    const originalLogout = base44.auth.logout;
    base44.auth.logout = async function(...args) {
      await popDownUser();
      return originalLogout.apply(this, args);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      base44.auth.logout = originalLogout;
    };
  }, []);
  const content = (
    <div className="min-h-screen bg-slate-50">
      <SessionManager />
      <InactivityManager />
      <BroadcastNotifications userEmail={userEmail} />
      <style>{`
        :root {
          --primary: 139 92 246;
          --primary-foreground: 255 255 255;
        }

        .custom-marker {
          background: transparent;
          border: none;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          border: none;
        }

        .leaflet-popup-tip {
          display: none;
        }

        .leaflet-container {
          font-family: inherit;
        }

        .leaflet-tile {
          filter: sepia(0.1) hue-rotate(180deg) saturate(1.3) brightness(1.1);
        }
      `}</style>
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: 'rounded-xl',
        }}
      />
      {children}
    </div>
  );

  if (shouldCheckSubscription) {
    return <SubscriptionGate>{content}</SubscriptionGate>;
  }

  return content;
}