import React, { useEffect } from 'react';
import { Toaster } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function Layout({ children }) {
  // Auto pop-down on page unload/close or logout
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

    // Handle page visibility changes (tab close, navigate away)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        popDownUser();
      }
    };

    // Intercept logout calls
    const originalLogout = base44.auth.logout;
    base44.auth.logout = async function(...args) {
      await popDownUser();
      return originalLogout.apply(this, args);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      base44.auth.logout = originalLogout;
    };
  }, []);
  return (
    <div className="min-h-screen bg-slate-50">
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
}